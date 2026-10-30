import { describe, expect, it } from 'vitest'
import { MAX_COMMENT_LENGTH } from '@/lib/comments'
import { applyOperation } from './operations'
import type { CardComment } from '@/types/domain'
import {
  AT,
  makeBoard,
  makeComment,
  makeOp,
  run,
  withComments,
} from '@/test/fixtures'

const base = () => makeBoard({ todo: ['a', 'b'] })

describe('comment.add', () => {
  it('adds a top-level comment under its card, in order', () => {
    const state = withComments(base(), [
      makeComment('c1', 'a'),
      makeComment('c2', 'a'),
      makeComment('c3', 'a'),
    ])

    expect(state.commentChildren.a).toEqual(['c1', 'c2', 'c3'])
  })

  it('nests replies under their parent, three levels deep', () => {
    const state = withComments(base(), [
      makeComment('c1', 'a'),
      makeComment('c2', 'a', 'c1'),
      makeComment('c3', 'a', 'c2'),
    ])

    expect(state.commentChildren).toEqual({ a: ['c1'], c1: ['c2'], c2: ['c3'] })
  })

  it('ignores a duplicate', () => {
    const once = withComments(base(), [makeComment('c1', 'a')])

    expect(
      run(once, { type: 'comment.add', comment: makeComment('c1', 'a') }),
    ).toBe(once)
  })

  it('rejects a comment on a card that does not exist', () => {
    const state = base()

    expect(
      run(state, { type: 'comment.add', comment: makeComment('c1', 'ghost') }),
    ).toBe(state)
  })

  it('rejects a reply whose parent is missing or belongs to another card', () => {
    const state = withComments(base(), [makeComment('c1', 'a')])

    expect(
      run(state, {
        type: 'comment.add',
        comment: makeComment('x', 'a', 'ghost'),
      }),
    ).toBe(state)
    expect(
      run(state, { type: 'comment.add', comment: makeComment('y', 'b', 'c1') }),
    ).toBe(state)
  })

  it('rejects an empty or oversized body', () => {
    const state = base()
    const empty = makeComment('c1', 'a', null, { body: '' })
    const tooLong = makeComment('c2', 'a', null, {
      body: 'x'.repeat(MAX_COMMENT_LENGTH + 1),
    })
    const maxLength = makeComment('c3', 'a', null, {
      body: 'x'.repeat(MAX_COMMENT_LENGTH),
    })

    expect(run(state, { type: 'comment.add', comment: empty })).toBe(state)
    expect(run(state, { type: 'comment.add', comment: tooLong })).toBe(state)
    expect(run(state, { type: 'comment.add', comment: maxLength })).not.toBe(
      state,
    )
  })
})

describe('comment.edit', () => {
  const edited = () => withComments(base(), [makeComment('c1', 'a')])

  it('changes the body and the update time', () => {
    const next = run(edited(), {
      type: 'comment.edit',
      commentId: 'c1',
      body: 'Better',
      authorId: 'author-1',
    })

    expect(next.comments.c1).toMatchObject({ body: 'Better', updatedAt: AT })
  })

  it('only lets the author edit', () => {
    const state = edited()

    expect(
      run(state, {
        type: 'comment.edit',
        commentId: 'c1',
        body: 'Hacked',
        authorId: 'intruder',
      }),
    ).toBe(state)
  })

  it('rejects an empty body and ignores an unchanged one', () => {
    const state = edited()

    expect(
      run(state, {
        type: 'comment.edit',
        commentId: 'c1',
        body: '',
        authorId: 'author-1',
      }),
    ).toBe(state)
    expect(
      run(state, {
        type: 'comment.edit',
        commentId: 'c1',
        body: 'Comment c1',
        authorId: 'author-1',
      }),
    ).toBe(state)
  })

  it('loses to a delete', () => {
    const deleted = run(edited(), {
      type: 'comment.delete',
      commentId: 'c1',
      authorId: 'author-1',
    })

    expect(
      run(deleted, {
        type: 'comment.edit',
        commentId: 'c1',
        body: 'Too late',
        authorId: 'author-1',
      }),
    ).toBe(deleted)
  })
})

describe('comment.delete (tombstones)', () => {
  const thread = () =>
    withComments(base(), [makeComment('c1', 'a'), makeComment('c2', 'a', 'c1')])

  it('leaves a tombstone so replies keep their parent', () => {
    const next = run(thread(), {
      type: 'comment.delete',
      commentId: 'c1',
      authorId: 'author-1',
    })

    expect(next.comments.c1).toMatchObject({ deleted: true, body: '' })
    expect(next.commentChildren.c1).toEqual(['c2'])
    expect(next.comments.c2.body).toBe('Comment c2')
  })

  it('still accepts a reply to a tombstone (delete versus reply is harmless)', () => {
    const deleted = run(thread(), {
      type: 'comment.delete',
      commentId: 'c1',
      authorId: 'author-1',
    })
    const next = run(deleted, {
      type: 'comment.add',
      comment: makeComment('c3', 'a', 'c1'),
    })

    expect(next.commentChildren.c1).toEqual(['c2', 'c3'])
  })

  it('only lets the author delete, and only once', () => {
    const state = thread()
    const deleted = run(state, {
      type: 'comment.delete',
      commentId: 'c1',
      authorId: 'author-1',
    })

    expect(
      run(state, {
        type: 'comment.delete',
        commentId: 'c1',
        authorId: 'intruder',
      }),
    ).toBe(state)
    expect(
      run(deleted, {
        type: 'comment.delete',
        commentId: 'c1',
        authorId: 'author-1',
      }),
    ).toBe(deleted)
  })
})

describe('large threads', () => {
  it('deletes a 20,000-deep thread with its card without overflowing the call stack', () => {
    const depth = 20_000
    const comments: Record<string, CardComment> = {}
    const commentChildren: Record<string, string[]> = { a: ['c0'] }

    for (let i = 0; i < depth; i += 1) {
      comments[`c${i}`] = makeComment(
        `c${i}`,
        'a',
        i === 0 ? null : `c${i - 1}`,
      )
      if (i < depth - 1) commentChildren[`c${i}`] = [`c${i + 1}`]
    }

    const next = applyOperation(
      { ...base(), comments, commentChildren },
      makeOp({ type: 'card.delete', cardId: 'a' }),
    )

    expect(next.comments).toEqual({})
    expect(next.commentChildren).toEqual({})
  })
})
