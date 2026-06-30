import React, { useEffect } from 'react';
import { useChatStore } from './store/chatStore';
import ChatSidebar from './components/Chat/ChatSidebar';
import ChatContainer from './components/Chat/ChatContainer';
import SettingsDrawer from './components/Settings/SettingsDrawer';
import AppHeader from './components/Layout/AppHeader';
import { Layout } from 'antd';
import './index.css';

const { Content } = Layout;

function App() {
  const { 
    conversations, 
    currentConversationId, 
    messages,
    fetchConversations, 
    createConversation, 
    selectConversation,
    deleteConversation,
    sendMessage,
    isLoading
  } = useChatStore();
  
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [role, setRole] = React.useState('maintainer');

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleNewConversation = async () => {
    const newConv = await createConversation('新会话');
    if (newConv) {
      selectConversation(newConv.id);
    }
  };

  const handleDeleteConversation = async (id) => {
    await deleteConversation(id);
  };

  const handleSendMessage = async (content) => {
    await sendMessage(content);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader 
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewConversation={handleNewConversation}
        onSettingsClick={() => setSettingsOpen(true)}
        role={role}
        onRoleChange={setRole}
      />
      <Layout>
        <ChatSidebar 
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          collapsed={sidebarCollapsed}
        />
        <Content>
          <ChatContainer 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </Content>
      </Layout>
      <SettingsDrawer 
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)} 
      />
    </Layout>
  );
}

export default App;
