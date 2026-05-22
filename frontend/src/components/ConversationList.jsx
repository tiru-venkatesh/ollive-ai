import { sdk } from '../lib/sdk';

export default function ConversationList({ onResume }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    const data = await sdk.getConversations();
    setConversations(data);
    setLoading(false);
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Delete this conversation?')) return;
    await sdk.deleteConversation(sessionId);
    setConversations(prev => prev.filter(c => c._id !== sessionId));
  };

  if (loading) return <div className="loading-state">Loading conversations...</div>;

  return (
    <div className="conversations-container">
      <div className="section-header">
        <h2>Conversations</h2>
        <button onClick={loadConversations} className="btn-secondary">Refresh</button>
      </div>

      {conversations.length === 0 ? (
        <div className="empty-state">No conversations yet. Start chatting!</div>
      ) : (
        <div className="conversation-list">
          {conversations.map(conv => (
            <div key={conv._id} className="conversation-card">
              <div className="conv-info">
                <span className="conv-id">#{conv._id.slice(0, 8)}</span>
                <p className="conv-preview">{conv.lastMessage?.slice(0, 80)}...</p>
                <span className="conv-meta">
                  {conv.messageCount} messages · {new Date(conv.lastTimestamp).toLocaleString()}
                </span>
              </div>
              <div className="conv-actions">
                <button onClick={() => onResume(conv._id)} className="btn-primary">
                  Resume
                </button>
                <button onClick={() => handleDelete(conv._id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
