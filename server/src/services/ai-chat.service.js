import { primarySupabaseClient } from '../config/supabaseClient.js';
import accessLogger from '../config/logger.js';

/**
 * Creates a new AI chat session.
 */
export async function createSession(userEmail, title, isIncognito = false) {
    if (isIncognito) return null; // Do not save incognito sessions

    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .insert([{ user_email: userEmail, title, is_incognito: false }])
        .select()
        .single();

    if (error) {
        console.error("Error creating AI chat session:", error);
        throw error;
    }
    
    return data;
}

/**
 * Updates the title of an existing AI chat session.
 */
export async function updateSessionTitle(sessionId, title) {
    if (!sessionId) return null;

    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .update({ title })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) {
        console.error("Error updating AI chat session title:", error);
        throw error;
    }

    return data;
}

/**
 * Saves a message to an existing chat session.
 */
export async function saveMessage(sessionId, role, content, fileUrls = []) {
    if (!sessionId) return null;

    const { data, error } = await primarySupabaseClient
        .from('ai_chat_messages')
        .insert([{ session_id: sessionId, role, content, file_urls: fileUrls }])
        .select()
        .single();

    if (error) {
        console.error("Error saving AI chat message:", error);
        throw error;
    }

    return data;
}

/**
 * Retrieves all non-incognito sessions for a user.
 */
export async function getSessions(userEmail) {
    const { data, error } = await primarySupabaseClient
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_email', userEmail)
        .eq('is_incognito', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching AI chat sessions:", error);
        throw error;
    }

    return data;
}

/**
 * Retrieves all messages for a given session.
 */
export async function getSessionMessages(sessionId) {
    const { data, error } = await primarySupabaseClient
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching AI chat messages:", error);
        throw error;
    }

    return data;
}
