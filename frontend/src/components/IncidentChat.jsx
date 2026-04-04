import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const IncidentChat = ({ incidentId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomId, setRoomId] = useState(null);
    const messagesEndRef = useRef(null);

    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!incidentId || !user) return;

        // 1. Get Room ID and Status
        const fetchRoom = async () => {
            const { data, error } = await supabase
                .from('incident_rooms')
                .select('id, is_active')
                .eq('incident_id', incidentId)
                .single();

            if (data) {
                setRoomId(data.id);
                setIsActive(data.is_active);
                fetchMessages(data.id);
                subscribeToMessages(data.id);
                subscribeToRoomStatus(data.id);
            }
        };

        fetchRoom();

        return () => {
            supabase.removeAllChannels();
        };
    }, [incidentId, user]);

    const subscribeToRoomStatus = (roomId) => {
        supabase
            .channel(`room_status:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'incident_rooms', filter: `id=eq.${roomId}` },
                (payload) => {
                    setIsActive(payload.new.is_active);
                }
            )
            .subscribe();
    };

    const fetchMessages = async (roomId) => {
        const { data } = await supabase
            .from('incident_messages')
            .select('*, profiles(full_name, role)')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
        scrollToBottom();
    };

    const subscribeToMessages = (roomId) => {
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'incident_messages', filter: `room_id=eq.${roomId}` },
                async (payload) => {
                    // Avoid adding our own message twice (already added optimistically)
                    // But wait, the optimistic one doesn't have a real ID yet.
                    // Let's check sender_id and content to prevent duplicates if needed, 
                    // or just rely on the realtime event and remove the local optimistic one.

                    if (payload.new.sender_id === user?.id) return;

                    const { data: senderProfile } = await supabase
                        .from('profiles')
                        .select('full_name, role')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg = {
                        ...payload.new,
                        profiles: senderProfile
                    };
                    setMessages(prev => [...prev, newMsg]);
                    scrollToBottom();
                }
            )
            .subscribe();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !roomId) return;

        const messageContent = newMessage;
        setNewMessage('');

        // Optimistic UI Update
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            room_id: roomId,
            sender_id: user.id,
            content: messageContent,
            created_at: new Date().toISOString(),
            profiles: {
                full_name: user.user_metadata?.full_name || 'Me',
                role: 'user' // Default or get from profile context
            }
        };

        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        const { data, error } = await supabase
            .from('incident_messages')
            .insert({
                room_id: roomId,
                sender_id: user.id,
                content: messageContent
            })
            .select();

        if (error) {
            console.error(error);
            // Remove optimistic message if it failed
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert('Failed to send message');
        } else {
            // Replace optimistic message with real message from DB (to get real ID and timestamp)
            if (data && data[0]) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...data[0], profiles: optimisticMsg.profiles } : m));
            }
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 p-3 border-b border-gray-700 font-bold text-gray-200">
                Incident Command Chat
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    const role = msg.profiles?.role || 'user';
                    const name = msg.profiles?.full_name || 'Unknown';

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' :
                                role === 'agency' ? 'bg-red-900/80 border border-red-500 text-white' : 'bg-gray-700 text-gray-200'
                                }`}>
                                <div className="text-xs opacity-75 mb-1 flex justify-between gap-2">
                                    <span className="font-bold">{name}</span>
                                    <span className="uppercase tracking-wider text-[10px]">{role}</span>
                                </div>
                                <div>{msg.content}</div>
                            </div>
                        </div>
                    );
                })}
                {!isActive && (
                    <div className="flex justify-center my-4">
                        <div className="bg-gray-800 border border-gray-600 px-4 py-2 rounded-full text-gray-400 text-xs font-bold uppercase tracking-widest">
                            Chat Session Closed
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-gray-800 flex gap-2">
                <input
                    type="text"
                    disabled={!isActive}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isActive ? "Type a message..." : "Chat session is closed"}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    type="submit"
                    disabled={!roomId || !isActive}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default IncidentChat;
