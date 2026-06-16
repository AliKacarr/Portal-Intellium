using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.ExpenseDraftSnapshotRepository
{
    public class EfExpenseDraftSnapshotDal : EfEntityRepositoryBase<ExpenseDraftSnapshot, PortalContext>, IExpenseDraftSnapshotDal
    {
        public int DeleteSnapshotsReferencingExpenseDraftId(long userId, long expenseDraftId)
        {
            using var ctx = new PortalContext();
            return ctx.Database.ExecuteSqlRaw(
                @"DELETE FROM expense_drafts
                WHERE user_id = {0}
                AND (
                  EXISTS (
                    SELECT 1 FROM jsonb_array_elements(COALESCE(payload_json->'expenses','[]'::jsonb)) AS t(elem)
                    WHERE (elem->>'id') ~ '^[0-9]+$' AND (elem->>'id')::bigint = {1}
                  )
                  OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements(COALESCE(payload_json->'drafts','[]'::jsonb)) AS t(elem)
                    WHERE (elem->>'id') ~ '^[0-9]+$' AND (elem->>'id')::bigint = {1}
                  )
                  OR ((payload_json->>'expenseId') ~ '^[0-9]+$' AND (payload_json->>'expenseId')::bigint = {1})
                  OR ((payload_json->>'draftExpenseId') ~ '^[0-9]+$' AND (payload_json->>'draftExpenseId')::bigint = {1})
                  OR ((payload_json->>'expenseDraftId') ~ '^[0-9]+$' AND (payload_json->>'expenseDraftId')::bigint = {1})
                );",
                userId, expenseDraftId);
        }

        public int DeleteSnapshotsForRequestId(long userId, string requestId)
        {
            if (string.IsNullOrWhiteSpace(requestId))
                return 0;
            var rid = requestId.Trim();
            using var ctx = new PortalContext();
            return ctx.Database.ExecuteSqlRaw(
                @"DELETE FROM expense_drafts d
                WHERE d.user_id = {0}
                  AND (
                    lower(trim(both from coalesce(d.payload_json->>'requestId',''))) = lower(trim(both from {1}))
                    OR EXISTS (
                      SELECT 1
                      FROM jsonb_array_elements(coalesce(d.payload_json->'expenses','[]'::jsonb)) AS t(elem)
                      WHERE lower(trim(both from coalesce(elem->>'requestId',''))) = lower(trim(both from {1}))
                    )
                    OR EXISTS (
                      SELECT 1
                      FROM jsonb_array_elements(coalesce(d.payload_json->'drafts','[]'::jsonb)) AS t(elem)
                      WHERE lower(trim(both from coalesce(elem->>'requestId',''))) = lower(trim(both from {1}))
                    )
                  );",
                userId, rid);
        }
    }
}

