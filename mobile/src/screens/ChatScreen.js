import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { getMessages } from '../services/messageService';
import { AuthContext } from '../context/AuthContext';
import { SERVER_URL } from '../config/api';
import { io } from 'socket.io-client';
import { colors } from '../utils/theme';

export default function ChatScreen({ route, navigation }) {
  const { userId, username, isOnline: initialOnlineStatus } = route.params;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isOnline, setIsOnline] = useState(initialOnlineStatus);
  const { user, token } = useContext(AuthContext);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: username,
      headerStyle: {
        backgroundColor: colors.black[900],
      },
      headerTintColor: colors.yellow[400],
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    loadMessages();
  }, [userId]);

  useEffect(() => {
    if (!token) return;

    const newSocket = initializeSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [token, userId]);

  const initializeSocket = () => {
    const newSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected in chat');
    });

    newSocket.on('message:new', (newMessage) => {
      // This is a message received from the person we're chatting with
      const senderId = newMessage.senderId?._id?.toString() || newMessage.senderId?.toString() || newMessage.senderId;
      const receiverId = newMessage.receiverId?.toString() || newMessage.receiverId?.toString() || newMessage.receiverId;
      const currentUserId = user?.id?.toString() || user?.id?.toString() || user?.id;
      const chatUserId = userId?.toString() || userId;
      
      // Check if this message is for us from the person we're chatting with
      if (senderId === chatUserId && receiverId === currentUserId) {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === newMessage._id);
          if (!exists) {
            return [...prev, newMessage];
          }
          return prev;
        });
        scrollToBottom();
        markAsRead(newMessage._id, senderId);
      }
    });

    newSocket.on('message:sent', (sentMessage) => {
      // This is a message we sent
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === sentMessage._id);
        if (!exists) {
          return [...prev, sentMessage];
        }
        return prev;
      });
      scrollToBottom();
    });

    newSocket.on('message:read', (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, isRead: true, readAt: data.readAt } : m
        )
      );
    });

    newSocket.on('typing:start', (data) => {
      if (data.senderId === userId) {
        setIsTyping(true);
      }
    });

    newSocket.on('typing:stop', (data) => {
      if (data.senderId === userId) {
        setIsTyping(false);
      }
    });

    newSocket.on('user:online', (data) => {
      if (data.userId === userId) {
        setIsOnline(true);
      }
    });

    newSocket.on('user:offline', (data) => {
      if (data.userId === userId) {
        setIsOnline(false);
      }
    });

    socketRef.current = newSocket;
    return newSocket;
  };

  const loadMessages = async () => {
    try {
      const data = await getMessages(userId);
      setMessages(data);
      scrollToBottom();
      markAllAsRead();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleSend = () => {
    if (!message.trim() || !socketRef.current) return;

    socketRef.current.emit('message:send', {
      receiverId: userId,
      message: message.trim(),
    });

    setMessage('');
    stopTyping();
  };

  const handleTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit('typing:start', { receiverId: userId });

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing:stop', { receiverId: userId });
      }
    }, 1000);

    setTypingTimeout(timeout);
  };

  const stopTyping = () => {
    if (socketRef.current && typingTimeout) {
      clearTimeout(typingTimeout);
      socketRef.current.emit('typing:stop', { receiverId: userId });
    }
  };

  const markAsRead = (messageId, senderId) => {
    if (socketRef.current) {
      socketRef.current.emit('message:read', { messageId, senderId });
    }
  };

  const markAllAsRead = () => {
    if (socketRef.current) {
      socketRef.current.emit('messages:read-all', { senderId: userId });
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const senderId = item.senderId?._id?.toString() || item.senderId?.toString() || item.senderId;
    const currentUserId = user?.id?.toString() || user?.id;
    const isSent = senderId === currentUserId;
    const messageContent = typeof item.message === 'string' ? item.message : item.message;

    return (
      <View style={[styles.messageContainer, isSent ? styles.messageSent : styles.messageReceived]}>
        <View style={[styles.messageBubble, isSent ? styles.messageBubbleSent : styles.messageBubbleReceived]}>
          <Text style={[styles.messageText, isSent ? styles.messageTextSent : styles.messageTextReceived]}>
            {messageContent}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isSent ? styles.messageTimeSent : styles.messageTimeReceived]}>
              {formatTime(item.createdAt)}
            </Text>
            {isSent && (
              <Text style={styles.readReceipt}>
                {item.isRead ? '✓✓' : item.isDelivered ? '✓' : ''}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.yellow[400]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatContainer}>
        {isOnline && (
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>{username} is online</Text>
          </View>
        )}
        {isTyping && (
          <View style={styles.statusBar}>
            <Text style={styles.typingText}>{username} is typing...</Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.gray[400]}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (text.length > 0) {
                handleTyping();
              } else {
                stopTyping();
              }
            }}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black[900],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.black[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  statusBar: {
    backgroundColor: colors.black[800],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.yellow[400]}33`,
  },
  statusText: {
    color: colors.green[500],
    fontSize: 14,
  },
  typingText: {
    color: colors.yellow[400],
    fontSize: 14,
    fontStyle: 'italic',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageSent: {
    justifyContent: 'flex-end',
  },
  messageReceived: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageBubbleSent: {
    backgroundColor: colors.yellow[400],
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: colors.black[800],
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: `${colors.yellow[400]}50`,
  },
  messageText: {
    fontSize: 16,
  },
  messageTextSent: {
    color: colors.black[900],
  },
  messageTextReceived: {
    color: colors.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    marginRight: 4,
  },
  messageTimeSent: {
    color: '#374151',
  },
  messageTimeReceived: {
    color: colors.gray[500],
  },
  readReceipt: {
    fontSize: 12,
    color: '#374151',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: colors.gray[500],
    fontSize: 18,
  },
  emptySubtext: {
    color: colors.gray[600],
    fontSize: 14,
    marginTop: 8,
  },
  inputContainer: {
    backgroundColor: colors.black[800],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: `${colors.yellow[400]}33`,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.black[900],
    color: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: `${colors.yellow[400]}50`,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.yellow[400],
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.black[900],
    fontWeight: 'bold',
    fontSize: 18,
  },
});
