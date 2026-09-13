# Dual is a pair: one checkout, two Students

Date: 2026-09-13

Academia DG only sells Dual when the booker **brings their own companion** (partner, child, teammate). It is not a grupal of capacity 2 and not two uncoordinated drop-ins.

**Decision:** the player makes **one** reservation (widget or José). That checkout names the companion (intake forms on Dual only: name + WhatsApp, required). SimplyBook then holds **two Students** on that session: two client records and two bookings (`count: 1` each, same provider + location + start). Occupancy is two of the coach’s `qty`, not Limit Bookings on the Dual service.

The widget may first lock two seats as `count: 2` on the booker’s booking (`min_group_booking: 2`, set in Dual → More options; REST PUT ignores that field). A follow-up (import or `simplybook-materialize-dual`) upserts the companion client and splits into two `count: 1` rows so the calendar shows both names. Until that split, a `count: 2` Dual is one person occupying two seats — incomplete.

Rejected: (a) two independent widget checkouts; (b) a merged “double client”; (c) Group Bookings as “bring N strangers”; (d) Limit Bookings = 2 as the pair cap (that limit is academy-wide at that clock time).
