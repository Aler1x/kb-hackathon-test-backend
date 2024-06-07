import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Bid } from 'src/bid/bid.schema';
import { User } from 'src/user/user.schema';
import { Category } from 'src/category/category.shema';

export type ChatDocument = HydratedDocument<Auction>;

class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Category | Types.ObjectId;

  @Prop()
  pictureUrl: string;
}

class Picture {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  url: string;
}

@Schema({ timestamps: true })
export class Auction {
  @Prop({ type: Product, required: true })
  product: Product;

  @Prop({ type: [Types.ObjectId], ref: 'Bid', default: [] })
  bids: Bid[];

  @Prop({ required: true, default: false })
  charity: boolean;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: User | Types.ObjectId;

  @Prop({ required: true })
  minPrice: number;

  @Prop({ required: true })
  minBidStep: number;

  @Prop({ required: true })
  currentMaxBidPrice: number;

  @Prop({ required: true })
  closeDate: Date;

  @Prop({ type: Picture })
  picture: {
    type: string;
    url: string;
  };

  // The createdAt field is automatically managed by Mongoose with { timestamps: true } option in the @Schema decorator.
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);
