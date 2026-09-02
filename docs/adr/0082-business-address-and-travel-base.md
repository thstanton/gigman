# Business Address and Travel Base are two concepts, not one field

`UserProfile` held a single address block that did double duty: the invoice letterhead printed it
as the musician's trading address, while the travel-time feature measured journeys to venues from
its `latitude`/`longitude`. Worse, the app actively solicited it under a third name — the dashboard
tip, the venue-map inline hint and `travel-time.service`'s error all said **"home address"** — while
Settings labelled the very same field "Business details — used on invoices". One field, three
stories. We split it into two named concepts.

**Business Address** is the trading address printed on the invoice letterhead. **Travel Base** is
the place the musician sets off from for gigs, and is the sole origin for travel-time estimates. It
is private and never appears on a document sent to a client.

## Why "home address" was the wrong term for both

It names a *kind of building* where both concepts need to name a *role*. For a sole trader the
business address usually *is* their home, so "home" fails to distinguish it from anything. And
musicians frequently do not set off from home — they set off from wherever the gear lives, which
may be a lockup, a rehearsal room or a studio. A term that guesses at the building is exactly what
let one field masquerade as two things. "Travel Base" was chosen over "Travel Origin" (precise but
reads as system jargon) and bare "Base" (the musician idiom "based in Leeds" means a *region*, not
a street address, and it never says what the field is for).

## The guard is a projection, not discipline

ADR-0002 split `PublicProfile` from `UserProfile` because DTO filtering "relies on developer
discipline at every call site — a structural boundary is safer." The clean version of that is
unavailable here: an invoice legitimately needs `bankDetails` and `vatNumber`, which live on
`UserProfile`, so the PDF path cannot simply be forbidden that model.

Instead the Travel Base columns sit on `UserProfile` alongside the business ones, and
`documents.service` consumes a `buildLetterhead()` allow-list returning only
`{ address, vatNumber, bankDetails }`. The PDF builder never receives a `UserProfile` again, so
`travelBase*` cannot reach a client document even by accident. This follows the projection idiom
already established by `buildPortalPublicProfile` and ADR-0073's `BAND_PORTAL_FIELDS`, and it puts
the guard on the read path that actually leaks rather than on the column.

A separate `TravelBase` model was considered and rejected: it buys a stronger guarantee than the
projection only for reads the projection already covers, at the cost of a table, a repository,
module wiring and an extra query on every travel-time call.

## No fallback when the Travel Base is unset

Travel time does not fall back to the business address. A silent fallback would rebuild the precise
coupling this ADR removes — journeys measured from a trading address that may be an accountant's
office or a PO box, with nothing on screen saying which origin produced the number. The empty state
is already built (`VenueMapWidget`'s `InlineHint`, the dashboard tip), so failing visibly costs
nothing and being subtly wrong costs trust.

## Migration: one address becomes two, by duplication

Both existing users hold a single address with no business/travel distinction to preserve, so the
migration copies the existing value into both fields. Everyone lands with a correct invoice and
working travel time, free to diverge the two later. Onboarding Step 1 follows the same rule: it
keeps a single address field and writes both, so new and existing musicians obey one story and
#478's friction-reduction goal is untouched.

The change is purely additive — new nullable `travelBase*` columns, no narrowing, no rename, no
contract release. The travel-time cache invalidation in `user-profile.repository.ts` moves from the
business address fields to the `travelBase*` fields: editing a trading address must no longer clear
every venue's cached journey, and editing the Travel Base must.

## Consequence: this is a privacy fix that was never a leak

Until #1010 the letterhead address rendered nowhere at all, so no home address has ever reached an
issued invoice PDF. #682's concern about immutable R2 documents needing remediation is moot. #682's
other claim — that the address prints on "invoices and contracts" — is also wrong: the contract PDF
builds its header from `PublicProfile` only and has never rendered an address.
