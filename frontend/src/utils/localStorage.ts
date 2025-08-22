export interface LocalStoragePoll {
  id: string;
  title: string;
  description: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  endDate: string;
  isActive: boolean;
  category: string;
  creator: {
    name: string;
    avatar: string;
    address: string;
  };
  createdAt: string;
  txHash?: string;
  onChain: boolean;
}

const POLLS_STORAGE_KEY = 'binpoll_local_polls';

export const getLocalPolls = (): LocalStoragePoll[] => {
  try {
    const stored = localStorage.getItem(POLLS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading polls from localStorage:', error);
    return [];
  }
};

export const saveLocalPoll = (poll: LocalStoragePoll): void => {
  try {
    const existingPolls = getLocalPolls();
    const updatedPolls = [...existingPolls, poll];
    localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
  } catch (error) {
    console.error('Error saving poll to localStorage:', error);
  }
};

export const updateLocalPoll = (pollId: string, updates: Partial<LocalStoragePoll>): void => {
  try {
    const existingPolls = getLocalPolls();
    const updatedPolls = existingPolls.map(poll => 
      poll.id === pollId ? { ...poll, ...updates } : poll
    );
    localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
  } catch (error) {
    console.error('Error updating poll in localStorage:', error);
  }
};

export const deleteLocalPoll = (pollId: string): void => {
  try {
    const existingPolls = getLocalPolls();
    const filteredPolls = existingPolls.filter(poll => poll.id !== pollId);
    localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(filteredPolls));
  } catch (error) {
    console.error('Error deleting poll from localStorage:', error);
  }
};

export const voteOnLocalPoll = (pollId: string, optionId: string, voterAddress: string): void => {
  try {
    const existingPolls = getLocalPolls();
    const updatedPolls = existingPolls.map(poll => {
      if (poll.id === pollId) {
        // Update the vote count for the selected option
        const updatedOptions = poll.options.map(option => {
          if (option.id === optionId) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });

        // Recalculate percentages and total votes
        const totalVotes = updatedOptions.reduce((sum, option) => sum + option.votes, 0);
        const optionsWithPercentages = updatedOptions.map(option => ({
          ...option,
          percentage: totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
        }));

        return {
          ...poll,
          options: optionsWithPercentages,
          totalVotes
        };
      }
      return poll;
    });
    
    localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
  } catch (error) {
    console.error('Error voting on poll in localStorage:', error);
  }
};

export const clearLocalPolls = (): void => {
  try {
    localStorage.removeItem(POLLS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing polls from localStorage:', error);
  }
};

export const createLocalPoll = (
  title: string,
  description: string,
  options: string[],
  durationHours: number,
  creatorName: string,
  creatorAddress: string,
  category: string = 'General'
): LocalStoragePoll => {
  const pollId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const endDate = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));

  const poll: LocalStoragePoll = {
    id: pollId,
    title,
    description,
    options: options.map((optionText, index) => ({
      id: `${pollId}_option_${index}`,
      text: optionText,
      votes: 0,
      percentage: 0
    })),
    totalVotes: 0,
    endDate: endDate.toISOString(),
    isActive: true,
    category,
    creator: {
      name: creatorName,
      avatar: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="#f0b90b"/><text x="75" y="85" font-family="Arial, sans-serif" font-size="60" fill="#1a1a1b" text-anchor="middle" font-weight="bold">${creatorName.split(' ').map(n => n[0]).join('').toUpperCase()}</text></svg>`)}`,
      address: creatorAddress
    },
    createdAt: now.toISOString(),
    onChain: false
  };

  return poll;
};
