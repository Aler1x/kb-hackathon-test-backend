export class UpdateAuctionDto {
  readonly product?: {
    name?: string;
    category?: string;
    pictureUrl?: string;
  };

  readonly charity?: boolean;

  readonly currency?: string;

  readonly minPrice: number;

  readonly minBidStep: number;

  readonly currentMaxBidPrice: number;

  readonly closeDate: Date;

  readonly picture?: {
    id: number;
    data: string;
    fileType: string;
    name: string;
  };
}
