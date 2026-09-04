import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { useState } from 'react';
import { apiPatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete, type AddressFields } from '@/components/common/AddressAutocomplete';
import { toast } from '@/lib/hooks/use-toast';
import { stepNav } from '@/features/onboarding/steps';
import type { PublicProfile, UserProfile } from '@/types/api';

const PATH = '/onboarding/profile';

const EMPTY_ADDRESS: AddressFields = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postcode: '',
  country: '',
  latitude: null,
  longitude: null,
  placeId: null,
};

function hasAddress(a: AddressFields): boolean {
  return Boolean(a.addressLine1.trim() || a.city.trim() || a.postcode.trim() || a.placeId);
}

function toBusinessAddressPayload(a: AddressFields): Partial<UserProfile> {
  return {
    addressLine1: a.addressLine1 || null,
    addressLine2: a.addressLine2 || null,
    city: a.city || null,
    county: a.county || null,
    postcode: a.postcode || null,
    country: a.country || null,
    latitude: a.latitude,
    longitude: a.longitude,
    placeId: a.placeId,
  };
}

function toTravelBasePayload(a: AddressFields): Partial<UserProfile> {
  return {
    travelBaseAddressLine1: a.addressLine1 || null,
    travelBaseAddressLine2: a.addressLine2 || null,
    travelBaseCity: a.city || null,
    travelBaseCounty: a.county || null,
    travelBasePostcode: a.postcode || null,
    travelBaseCountry: a.country || null,
    travelBaseLatitude: a.latitude,
    travelBaseLongitude: a.longitude,
    travelBasePlaceId: a.placeId,
  };
}

const schema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  displayName: z.string().optional(),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { next } = stepNav(PATH);

  const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      businessName: '',
      displayName: '',
      email: user?.primaryEmailAddress?.emailAddress ?? '',
      phone: '',
    },
  });

  // Step 1 spans two models: identity → PATCH /me/public (PublicProfile); the optional
  // address → PATCH /me (UserProfile). A musician doesn't yet distinguish a business
  // address from a Travel Base (PRD #478's friction-reduction intent), so the one value
  // given here is written to both — the same rule ADR-0082's migration applies to
  // existing users. The write only fires when an address was actually provided, so
  // leaving it blank never blocks the step.
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiPatch<PublicProfile>('/me/public', {
        businessName: data.businessName,
        displayName: data.displayName || null,
        email: data.email || null,
        phone: data.phone || null,
      });
      if (hasAddress(address)) {
        await apiPatch<UserProfile>('/me', {
          ...toBusinessAddressPayload(address),
          ...toTravelBasePayload(address),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      if (next) navigate(next);
    },
    onError: () => {
      toast({ title: 'Failed to save. Please try again.', variant: 'destructive' });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Set up your business"
        subheading="The basics GigLoop needs to work for you."
        className="mb-0"
      />

      <form onSubmit={handleSubmit((data) => mutate(data))} className="flex flex-col gap-4">
        <FormField
          label="Business name"
          hint="Your act or brand — shown to clients on your portal, invoices, and emails."
          error={errors.businessName?.message}
          required
        >
          <Input {...register('businessName')} placeholder="e.g. Smith String Quartet" />
        </FormField>

        <FormField
          label="Your name"
          hint="The personal name that signs your emails and contracts. Falls back to your business name if blank."
          error={errors.displayName?.message}
        >
          <Input {...register('displayName')} placeholder="e.g. James Smith" />
        </FormField>

        <FormField
          label="Email"
          hint="Where clients reply, and how GigLoop reaches you."
          error={errors.email?.message}
        >
          <Input {...register('email')} type="email" placeholder="you@example.com" />
        </FormField>

        <FormField
          label="Phone"
          hint="Shown to clients on your portal so they can call you."
          error={errors.phone?.message}
        >
          <Input {...register('phone')} type="tel" placeholder="+44 7700 900000" />
        </FormField>

        <FormField
          label="Your business address"
          hint="Optional. Shown on your invoices, and used to estimate travel time to venues. You can set these separately later in Settings."
        >
          <AddressAutocomplete value={address} onChange={setAddress} />
        </FormField>

        <div className="flex justify-start pt-2">
          <Button type="submit" disabled={!isValid || isPending}>
            {isPending ? 'Saving…' : 'Next'}
          </Button>
        </div>
      </form>
    </div>
  );
}
