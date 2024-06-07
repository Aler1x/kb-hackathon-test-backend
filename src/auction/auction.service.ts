import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction } from './auction.schema';
import { CreateAuctionDto } from './dtos/create-auction.dto';
import { UpdateAuctionDto } from './dtos/update-auction.dto';
import { Category } from 'src/category/category.shema';
import { HttpStatus, HttpException } from '@nestjs/common';
import { User } from 'src/user/user.schema';
import { FileService } from 'src/files/file.service';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly fileService: FileService,
  ) {}

  async findAll(): Promise<Auction[]> {
    return this.auctionModel.find().exec();
  }

  async findAllWithFilters(filters: any): Promise<Auction[]> {
    let categoryIds: string[] = [];

    // If category names are provided, fetch corresponding category IDs
    if (filters.category) {
      const categoryNames = filters.category
        .split(',')
        .map((name: string) => new RegExp(name.trim(), 'i'));
      const categories = await this.categoryModel.find({
        name: { $in: categoryNames },
      });
      categoryIds = categories.map((cat) => cat._id.toString());
    }

    let query = this.auctionModel.find();

    if (filters.charity !== undefined) {
      query.where('charity', filters.charity === 'true' ? true : false);
    }
    if (filters.currency !== undefined) {
      query.where('currency', new RegExp(filters.currency, 'i'));
    }
    if (filters.name !== undefined) {
      query.where('product.name', { $regex: filters.name, $options: 'i' });
    }

    // Filter by category IDs if categories were found
    if (categoryIds.length > 0) {
      query.where('product.category', { $in: categoryIds });
    }

    if (filters.createdBy !== undefined) {
      const users = await this.userModel.find({
        email: new RegExp(filters.createdBy, 'i'),
      });
      const userIds = users.map((user) => user._id.toString());

      if (userIds.length) {
        query.where('createdBy', { $in: userIds });
      } else {
        // No users found with that email, return empty result set
        return [];
      }
    }

    query = query
      .populate({
        path: 'createdBy',
        model: 'User',
      })
      .populate({
        path: 'product.category',
        model: 'Category',
      });

    const results = await query.exec();
    return results;
  }

  async findById(id: string): Promise<Auction> {
    const auction = await this.auctionModel
      .findById(id)
      .populate({
        path: 'product.category',
        model: 'Category',
      })
      .populate({
        path: 'bids',
        options: { sort: { createdAt: -1 } },
        populate: {
          path: 'createdBy',
          model: 'User',
        },
      })
      .populate('createdBy', 'User')
      .exec();

    if (!auction) {
      throw new HttpException(
        `Auction with ID ${id} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return auction;
  }

  async findByUser(userId: string): Promise<Auction[]> {
    return this.auctionModel
      .find({ createdBy: userId })
      .populate('createdBy', 'User')
      .exec();
  }

  async create(
    createAuctionDto: CreateAuctionDto,
    userId: string,
  ): Promise<Auction> {
    let picture = null;
    if (createAuctionDto.picture) {
      const picturePath = await this.fileService.saveFile(
        createAuctionDto.picture.data,
        `uploads/${createAuctionDto.picture.name}`,
      );

      picture = { url: picturePath, type: createAuctionDto.picture.fileType };
    }

    console.log('picture', picture);

    const createdAuction = new this.auctionModel({
      ...createAuctionDto,
      currentMaxBidPrice: createAuctionDto.minPrice,
      createdBy: userId,
      picture: picture ?? null,
    });

    const auction = await createdAuction.save();

    return this.findById(auction.id);
  }

  async update(
    id: string,
    updateAuctionDto: CreateAuctionDto,
  ): Promise<Auction> {
    let picture = null;
    if (updateAuctionDto.picture) {
      const picturePath = await this.fileService.saveFile(
        updateAuctionDto.picture.data,
        `uploads/${updateAuctionDto.picture.name}`,
      );

      picture = { url: picturePath, type: updateAuctionDto.picture.fileType };
    }

    const updatedAuction = await this.auctionModel
      .findByIdAndUpdate(id, {
        ...updateAuctionDto, 
        picture: picture ?? null,
      }, { new: true })
      .exec();

    if (!updatedAuction) {
      throw new HttpException(
        `Auction with ID ${id} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return updatedAuction;
  }

  async updatePartial(
    id: string,
    updateAuctionDto: UpdateAuctionDto,
  ): Promise<Auction> {
    const updatedAuction = await this.auctionModel
      .findByIdAndUpdate(id, updateAuctionDto, { new: true })
      .exec();
    if (!updatedAuction) {
      throw new HttpException(
        `Auction with ID ${id} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return updatedAuction;
  }
}
