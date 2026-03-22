import type { Request, Response, NextFunction } from 'express';
import type { SearchParams, SearchQuery } from './search.schemas';
import { search } from './search.service';
import { AppError } from '../../lib/errors';

export async function searchMessagesHandler(
  req: Request<SearchParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const query = req.query as unknown as SearchQuery;

    const result = await search(
      req.params.workspaceId,
      user.id,
      query.q,
      query.limit
    );

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
