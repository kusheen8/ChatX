import React, { useState, useEffect, useContext } from 'react'; // --- ADD useContext ---
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Button,
} from 'react-native';
import { getUsers } from '../services/userService';
import { AuthContext } from '../context/AuthContext'; // --- ADD AuthContext ---
import { SERVER_URL } from '../config/api';
import { io } from 'socket.io-client';
import { colors } from '../utils/theme';

export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // This gets the logout function from your AuthContext
  const { user, token, logout } = useContext(AuthContext); 
  // --- END ---

  useEffect(() => {
    loadUsers();
  }, []);

  // --- ADD THIS ---
  // This hook adds the "Logout" button to the top-right of the screen
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={logout} // When pressed, it calls the logout function
          title="Logout"
          color={colors.yellow[400]}
        />
      ),
    });
  }, [navigation, logout]); // It depends on navigation and the logout function
  

  useEffect(() => {
    if (!token) return;

    const newSocket = initializeSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token]);

  const initializeSocket = () => {
    const newSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('user:online', (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === data.userId ? { ...u, isOnline: true } : u
        )
      );
    });

    newSocket.on('user:offline', (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === data.userId ? { ...u, isOnline: false } : u
        )
      );
    });
    
    // This part listens for new messages to update the user list
    newSocket.on('message:new', (newMessage) => {
      updateLastMessage(newMessage);
    });
    newSocket.on('message:sent', (sentMessage) => {
      updateLastMessage(sentMessage, true);
    });

    return newSocket;
  };
  
  const updateLastMessage = (message, isFromMe = false) => {
    // Get the ID of the *other* person in the chat
    const otherUserId = isFromMe 
      ? message.receiverId.toString() 
      : message.senderId._id.toString();

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id.toString() === otherUserId) {
          // Update this user's last message details
          return {
            ...u,
            lastMessage: message.message,
            lastMessageTime: message.createdAt,
            lastMessageSenderId: message.senderId._id.toString(),
          };
        }
        return u;
      })
      // Sort the list to bring the most recent chat to the top
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    );
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      // Sort users by last message time when loading
      data.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return messageDate.toLocaleDateString();
  };

  const renderUser = ({ item }) => {
    // Check if the sender's ID (which could be an object) matches our ID
    const lastSenderId = item.lastMessageSenderId?._id?.toString() || item.lastMessageSenderId?.toString();
    const isCurrentUserMessage = lastSenderId === user?.id;
    
    const displayMessage = item.lastMessage
      ? isCurrentUserMessage
        ? `You: ${item.lastMessage}`
        : item.lastMessage
      : 'No messages yet';

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() =>
          navigation.navigate('Chat', {
            userId: item.id,
            username: item.username,
            isOnline: item.isOnline,
          })
        }
      >
        <View style={styles.userContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <Text style={styles.username}>{item.username}</Text>
              {item.lastMessageTime && (
                <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
              )}
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {displayMessage}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Chats</Text>
      </View>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.yellow[400]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
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
  header: {
    backgroundColor: colors.black[800],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.yellow[400]}33`,
  },
  headerText: {
    color: colors.yellow[400],
    fontSize: 24,
    fontWeight: 'bold',
  },
  userItem: {
    backgroundColor: colors.black[800],
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.yellow[400]}33`,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.yellow[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.black[900],
    fontWeight: 'bold',
    fontSize: 18,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    backgroundColor: colors.green[500],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.black[900],
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: colors.yellow[400],
    fontWeight: 'bold',
    fontSize: 18,
  },
  time: {
    color: colors.gray[500],
    fontSize: 12,
  },
  lastMessage: {
    color: colors.gray[400],
    fontSize: 14,
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
});