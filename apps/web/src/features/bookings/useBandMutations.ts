import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import { toast } from '@/lib/hooks/use-toast';
import type { BookingBandMemberStatus, BookingDetail } from '@/types/api';

// Band members v1 (#879, ADR-0072 §2/§3/§5, #884/#885; re-pointed by ADR-0081). Mirrors
// useItineraryMutations: the shell that drives the Band atom (BandSheet) owns these mutations; the
// atom stays presentational. Chair CRUD + lineups are #884; assignChair/updateMemberStatus/
// saveMemberFee are #885.
//
// #987 dropped three mutations along with the controls that drove them, on #983's resolved design:
// `moveChair`/`updateChair` (a part row carries ONE action, so the sheet has no reorder and no
// rename) and `removeMember` (no per-person remove — a player leaves by coming out of every part,
// and the Players card is purely derived). The API routes all still exist; nothing on this surface
// calls them. Flagged to the owner as a capability change, not a silent drop.

type Rollback = { prev?: BookingDetail };

export function useBandMutations(bookingId: string) {
  const queryClient = useQueryClient();
  const bookingKey = ['booking', bookingId];

  const invalidateBooking = () => {
    queryClient.invalidateQueries({ queryKey: bookingKey });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  // Mirrors useItineraryMutations.applyOptimistic — cancelQueries first is non-negotiable, else
  // an in-flight ['booking'] refetch can resolve after this write and resurrect a removed chair.
  async function applyOptimistic(edit: (b: BookingDetail) => BookingDetail): Promise<Rollback> {
    await queryClient.cancelQueries({ queryKey: bookingKey });
    const prev = queryClient.getQueryData<BookingDetail>(bookingKey);
    if (prev) queryClient.setQueryData<BookingDetail>(bookingKey, edit(prev));
    return { prev };
  }

  function rollback(ctx: Rollback | undefined, title: string) {
    if (ctx?.prev) queryClient.setQueryData(bookingKey, ctx.prev);
    toast({ title, variant: 'destructive' });
  }

  // #987: a lineup is applied to a *set* of segments, so one band playing the drinks and the
  // reception is one write, one Lineup, and four parts rather than eight. `packageIds: []` is a
  // real target (the whole gig, or a band parked with nothing to play yet), never "unset".
  const applyLineup = useMutation({
    mutationFn: ({ lineupTemplateId, packageIds }: { lineupTemplateId: string; packageIds: string[] }) =>
      apiPost(`/bookings/${bookingId}/lineups`, { lineupTemplateId, packageIds }),
    onSuccess: invalidateBooking,
    onError: () => toast({ title: 'Failed to apply lineup. Please try again.', variant: 'destructive' }),
  });

  // #987 journey ④ — "What they play…". Sets the whole segment set; the band keeps its parts, its
  // people and their confirmations either way.
  const setLineupSegments = useMutation({
    mutationFn: ({ lineupId, packageIds }: { lineupId: string; packageIds: string[] }) =>
      apiPatch(`/bookings/${bookingId}/lineups/${lineupId}`, { packageIds }),
    onSuccess: invalidateBooking,
    onError: () => toast({ title: 'Failed to update what this band plays. Please try again.', variant: 'destructive' }),
  });

  const removeLineup = useMutation({
    mutationFn: (lineupId: string) => apiDelete(`/bookings/${bookingId}/lineups/${lineupId}`),
    onSuccess: invalidateBooking,
    onError: () => toast({ title: 'Failed to remove this band. Please try again.', variant: 'destructive' }),
  });

  // `order` is server-computed (ADR-0081): it's the part's position within its Lineup. #987: the
  // part names its Lineup, not its segment — omitted, the server starts a fresh unnamed one, which
  // is the musician with no lineup templates adding one part at a time (#884).
  const addChair = useMutation({
    mutationFn: ({ role, lineupId }: { role: string; lineupId: string | null }) =>
      apiPost(`/bookings/${bookingId}/chairs`, {
        role,
        ...(lineupId ? { lineupId } : {}),
      }),
    onSuccess: invalidateBooking,
    onError: () => toast({ title: 'Failed to add part. Please try again.', variant: 'destructive' }),
  });

  const removeChair = useMutation({
    mutationFn: (chairId: string) => apiDelete(`/bookings/${bookingId}/chairs/${chairId}`),
    onMutate: (chairId) =>
      applyOptimistic((b) => ({
        ...b,
        band: { ...b.band, chairs: b.band.chairs.filter((c) => c.id !== chairId) },
      })),
    onError: (_e, _chairId, ctx) => rollback(ctx, 'Failed to remove chair. Please try again.'),
    onSettled: invalidateBooking,
  });

  // Assignment never creates or destroys a chair row, it sets a field (ADR-0072 §2) — server-first
  // like addChair/updateChair's re-parent, since the resulting member row (id, contact) isn't known
  // client-side until the response comes back. `contactId: null` vacates.
  const assignChair = useMutation({
    mutationFn: ({ chairId, contactId }: { chairId: string; contactId: string | null }) =>
      apiPatch(`/bookings/${bookingId}/chairs/${chairId}/assign`, { contactId }),
    onSuccess: invalidateBooking,
    onError: () => toast({ title: 'Failed to assign chair. Please try again.', variant: 'destructive' }),
  });

  // Every transition is organiser-driven from the Band sheet (ADR-0072 §5).
  const updateMemberStatus = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: BookingBandMemberStatus }) =>
      apiPatch(`/bookings/${bookingId}/band-members/${memberId}`, { status }),
    onSuccess: invalidateBooking,
    onError: () => toast({ title: 'Failed to update status. Please try again.', variant: 'destructive' }),
  });

  const saveMemberFee = useMutation({
    mutationFn: ({ memberId, sessionFee }: { memberId: string; sessionFee: number | null }) =>
      apiPatch(`/bookings/${bookingId}/band-members/${memberId}`, { sessionFee }),
    onSuccess: invalidateBooking,
    onError: () => toast({ title: 'Failed to save fee. Please try again.', variant: 'destructive' }),
  });

  return {
    applyLineup,
    setLineupSegments,
    removeLineup,
    addChair,
    removeChair,
    assignChair,
    updateMemberStatus,
    saveMemberFee,
  };
}
