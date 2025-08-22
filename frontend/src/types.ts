export interface Poll {
  id: number;
  title: string;
  description: string;
  creator: string;
  options: string[];
  endTime: number;
  settled: boolean;
  winningOption: number;
  totalPool: string;
}

export interface VoteInfo {
  voted: boolean;
  optionId: number;
}
