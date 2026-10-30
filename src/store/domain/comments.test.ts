import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_COMMENT_LENGTH } from '@/lib/comments'
import { getIdentity } from '@/lib/identity'
import { onLocalOperation, useDomainStore } from './domainStore'
import { makeBoard, makeComment, makeOp, must } from '@/test/fixtures'
import { resetStores } from '@/test/helpers'
import { applyOperation } from '@/realtime/operations'

const domain = () => useDomainStore.getState()

beforeEach(() => {
  resetStores()
  useDomainStore.setState(makeBoard({ todo: ['a', 'b'] }))
})

describe('addComment', () => {
  it('trims the text and records who wrote it', () => {
    const id = must(domain().addComment('a', null, '  hello  '))
    const comment = domain().comments[id]

    expect(comment?.body).toBe('hello')
    expect(comment?.authorId).toBe(getIdentity().id)
    expect(comment?.authorName).toBe(getIdentity().name)
  })

  it('builds a three-level thread', () => {
    const c1 = must(domain().addComment('a', null, 'one'))
    const c2 = must(domain().addComment('a', c1, 'two'))
    const c3 = must(domain().addComment('a', c2, 'three'))

    expect(domain().commentChildren).toEqual({
      a: [c1],
      [c1]: [c2],
      [c2]: [c3],
    })
  })

  it('rejects empty, whitespace-only and oversized text', () => {
    expect(domain().addComment('a', null, '')).toBeNull()
    expect(domain().addComment('a', null, '   ')).toBeNull()
    expect(
      domain().addComment('a', null, 'x'.repeat(MAX_COMMENT_LENGTH + 1)),
    ).toBeNull()
    expect(domain().comments).toEqual({})
  })

  it('rejects a missing card, a missing parent, or a parent from another card', () => {
    const onCardA = must(domain().addComment('a', null, 'on a'))

    expect(domain().addComment('ghost', null, 'x')).toBeNull()
    expect(domain().addComment('a', 'ghost', 'x')).toBeNull()
    expect(domain().addComment('b', onCardA, 'x')).toBeNull()
  })

  it('does not announce a rejected comment to other sessions', () => {
    const heard = vi.fn()
    const stop = onLocalOperation(heard)

    domain().addComment('a', null, '')
    expect(heard).not.toHaveBeenCalled()

    domain().addComment('a', null, 'real')
    expect(heard).toHaveBeenCalledTimes(1)
    stop()
  })
})

describe('editComment and deleteComment', () => {
  it('lets you edit and delete your own comment', () => {
    const id = must(domain().addComment('a', null, 'first'))

    domain().editComment(id, 'second')
    expect(domain().comments[id]?.body).toBe('second')

    domain().deleteComment(id)
    expect(domain().comments[id]).toMatchObject({ deleted: true, body: '' })
  })

  it("does not let you change someone else's comment", () => {
    const theirs = makeComment('theirs', 'a', null, {
      authorId: 'someone-else',
    })
    useDomainStore.setState(
      applyOperation(
        domain(),
        makeOp({ type: 'comment.add', comment: theirs }),
      ),
    )

    domain().editComment('theirs', 'hijacked')
    domain().deleteComment('theirs')

    expect(domain().comments.theirs).toMatchObject({
      body: 'Comment theirs',
      deleted: false,
    })
  })
})
