import React, { useEffect } from 'react';
import { useChatStore } from './store/chatStore';
import ChatSidebar from './components/Chat/ChatSidebar';
import ChatContainer from './components/Chat/ChatContainer';
import SettingsDrawer from './components/Settings/SettingsDrawer';
import AppHeader from './components/Layout/AppHeader';
import { Layout } from 'antd';
import './index.css';

const { Container } = Layout;

function App() {
  const fetchConversations = useChatStore(state => state.fetchConversations);
  const conversations = useChatStore(state => state.conversations);
  const currentConversationId = useChatStore(state => state.currentConversationId);
  const createConversation = useChatStore(state => state.createConversation);
  const selectConversation = useChatStore(state => state.selectConversation);
  
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleNewConversation = async () => {
    const newConv = await createConversation('新会话');
    if (newConv) {
      selectConversation(newConv.id);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader 
        onNewConversation={handleNewConversation}
        onSettingsClick={() => setSettingsOpen(true)}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Layout>
        {!sidebarCollapsed && (
          <ChatSidebar 
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={handleNewConversation}
          />
        )}
        <ChatContainer />
      </Layout>
      <SettingsDrawer 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Layout>
  );
}

export default App;
