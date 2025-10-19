import { Contract, GlobalState, LocalState, assert, Txn } from '@algorandfoundation/algorand-typescript';
import type { Account, uint64 } from '@algorandfoundation/algorand-typescript';

export class VotingContract extends Contract {
  // Global state tanımlamaları
  private totalVotes = GlobalState<uint64>();
  private isVotingOpen = GlobalState<boolean>({ initialValue: true });
  private admin = GlobalState<Account>();
  
  // Local state tanımlaması
  private userVotes = LocalState<uint64>();

  createApplication(): void {
    this.totalVotes.value = 0;
    this.admin.value = Txn.sender; // Admin'i kaydet
  }

  vote(candidateId: uint64): void {
    // Oylama açık mı kontrol et
    assert(this.isVotingOpen.value, 'Voting is closed');

    // Kullanıcı daha önce oy kullanmış mı kontrol et
    assert(!this.userVotes(Txn.sender).hasValue, 'User already voted');
    
    // Oy kaydet
    this.userVotes(Txn.sender).value = candidateId;
    this.totalVotes.value = this.totalVotes.value + 1;
  }

  getVotes(): uint64 {
    return this.totalVotes.value;
  }

  closeVoting(): void {
    // Sadece admin oylama kapatabilir
    assert(Txn.sender === this.admin.value, 'Only admin can close voting');
    this.isVotingOpen.value = false;
  }

  getVotingStatus(): boolean {
    return this.isVotingOpen.value;
  }

  getUserVote(user: Account): uint64 {
    if (this.userVotes(user).hasValue) {
      return this.userVotes(user).value;
    }
    return 0;
  }
}