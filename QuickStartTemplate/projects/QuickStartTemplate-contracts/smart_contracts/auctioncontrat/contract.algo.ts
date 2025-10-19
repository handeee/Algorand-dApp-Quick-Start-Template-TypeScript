import { Contract, GlobalState, assert, Txn, Global } from '@algorandfoundation/algorand-typescript';
import type { Account, uint64 } from '@algorandfoundation/algorand-typescript';

export class AuctionContract extends Contract {
  auctionTitle = GlobalState<string>();
  auctionDesc = GlobalState<string>();

  startingPrice = GlobalState<uint64>(); // başlangıç fiyatı
  reservePrice = GlobalState<uint64>(); // minimum kabul edilebilir fiyat
  auctionEndTime = GlobalState<uint64>(); // açık artırma bitiş zamanı

  // mevcut devam eden kontrat bilgileri
  currentHighestBid = GlobalState<uint64>(); // en yüksek teklif
  currentHighestBidder = GlobalState<Account>(); // en yüksek teklifi veren hesap
  totalBids = GlobalState<uint64>(); // toplam teklif sayısı

  isAuctionActive = GlobalState<boolean>({ initialValue: false }); // açık artırma aktif mi
  isAuctionEnded = GlobalState<boolean>({ initialValue: false }); // açık artırma sona erdi mi

  auctionCreator = GlobalState<Account>(); // kontrat oluşturucu

  createApplication(
    title: string,
    desc: string,
    startPrice: uint64,
    reservePrice: uint64,
    durationInSeconds: uint64
  ): void {
    this.auctionTitle.value = title;
    this.auctionDesc.value = desc;
    this.startingPrice.value = startPrice;
    this.reservePrice.value = reservePrice;

    // sonlandırma zamanını mevcut zamana duration ekleyerek ayarla
    this.auctionEndTime.value = Global.latestTimestamp + durationInSeconds;

    this.currentHighestBid.value = startPrice;
    this.currentHighestBidder.value = Txn.sender;
    this.totalBids.value = 0;
    this.isAuctionActive.value = true;
    this.auctionCreator.value = Txn.sender;
  }

  placeBid(bidAmount: uint64): void {
    // açık artırma aktif mi kontrol et
    assert(this.isAuctionActive.value, 'Auction is not active');
    assert(Global.latestTimestamp < this.auctionEndTime.value, 'Auction has ended');

    assert(bidAmount > this.currentHighestBid.value, 'Bid amount must be higher than current highest bid');

    assert(Txn.sender !== this.auctionCreator.value, 'Auction creator cannot bid');

    this.currentHighestBid.value = bidAmount;
    this.currentHighestBidder.value = Txn.sender;
    this.totalBids.value = this.totalBids.value + 1;
  }

  endAuction(): void {
    assert(this.isAuctionActive.value, 'Auction is not active');
    assert(Global.latestTimestamp >= this.auctionEndTime.value, 'Auction duration has not yet ended');

    this.isAuctionActive.value = false;
    this.isAuctionEnded.value = true;
  }

  getCurrentHighestBid(): uint64 {
    return this.currentHighestBid.value;
  }

  getCurrentHighestBidder(): Account {
    return this.currentHighestBidder.value;
  }

  getTotalBids(): uint64 {
    return this.totalBids.value;
  }

  getAuctionStatus(): boolean {
    return this.isAuctionActive.value;
  }

  hasAuctionEnded(): boolean {
    return this.isAuctionEnded.value;
  }

  getAuctionEndTime(): uint64 {
    return this.auctionEndTime.value;
  }

  getStartingPrice(): uint64 {
    return this.startingPrice.value;
  }

  getReservePrice(): uint64 {
    return this.reservePrice.value;
  }

  getAuctionCreator(): Account {
    return this.auctionCreator.value;
  }

  getAuctionTitle(): string {
    return this.auctionTitle.value;
  }

  getAuctionDesc(): string {
    return this.auctionDesc.value;
  }

  isReservePriceMet(): boolean {
    return this.currentHighestBid.value >= this.reservePrice.value;
  }

  emergencyStopAuction(): void {
    assert(Txn.sender === this.auctionCreator.value, 'Only auction creator can stop the auction');
    assert(this.isAuctionActive.value, 'Auction is not active');
    this.isAuctionActive.value = false;
    this.isAuctionEnded.value = true;
  }

  getTimeRemaining(): uint64 {
    if (Global.latestTimestamp >= this.auctionEndTime.value) {
      return 0;
    }
    return this.auctionEndTime.value - Global.latestTimestamp;
  }
}