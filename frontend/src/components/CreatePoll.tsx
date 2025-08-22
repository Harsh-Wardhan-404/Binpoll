import { useState } from 'react';
import { useContract } from '../hooks/useContract';

export function CreatePoll() {
  const { createPoll, loading, error } = useContract();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(24);

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description');
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const pollId = await createPoll(title, description, validOptions, duration);
    
    if (pollId !== null) {
      alert(`Poll created successfully! ID: ${pollId}`);
      // Reset form
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setDuration(24);
    }
  };

  return (
    <div className="create-poll">
      <h2>Create New Poll</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Will BNB hit $1000 this year?"
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your prediction market..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Duration (hours):</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={1}
            max={720}
          />
        </div>

        <div className="form-group">
          <label>Options:</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="remove-option"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          
          {options.length < 5 && (
            <button type="button" onClick={addOption} className="add-option">
              + Add Option
            </button>
          )}
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating...' : 'Create Poll'}
        </button>

        {error && <div className="error">❌ {error}</div>}
      </form>
    </div>
  );
}
