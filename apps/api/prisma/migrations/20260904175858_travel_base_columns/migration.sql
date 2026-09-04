-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "travelBaseAddressLine1" TEXT,
ADD COLUMN     "travelBaseAddressLine2" TEXT,
ADD COLUMN     "travelBaseCity" TEXT,
ADD COLUMN     "travelBaseCountry" TEXT,
ADD COLUMN     "travelBaseCounty" TEXT,
ADD COLUMN     "travelBaseLatitude" DOUBLE PRECISION,
ADD COLUMN     "travelBaseLongitude" DOUBLE PRECISION,
ADD COLUMN     "travelBasePlaceId" TEXT,
ADD COLUMN     "travelBasePostcode" TEXT;

-- Data migration (ADR-0082): duplicate each profile's existing address into its new Travel
-- Base columns. Both real users hold a single address with no business/travel distinction to
-- preserve, so this leaves everyone with a correct invoice AND working travel time, free to
-- diverge the two later. Profiles with no address (all columns null) stay null on both sides.
UPDATE "UserProfile"
SET
  "travelBaseAddressLine1" = "addressLine1",
  "travelBaseAddressLine2" = "addressLine2",
  "travelBaseCity" = "city",
  "travelBaseCounty" = "county",
  "travelBasePostcode" = "postcode",
  "travelBaseCountry" = "country",
  "travelBaseLatitude" = "latitude",
  "travelBaseLongitude" = "longitude",
  "travelBasePlaceId" = "placeId";
