import supabase from '../config/supabase.js'; // Note: If this throws an error later, change to: import { supabase } from '../config/supabase.js';

// 1. GET all posts for a specific locality
export const getForumPosts = async (req, res) => {
  try {
    const { locality } = req.params;
    
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('locality', locality)
      .order('created_at', { ascending: true }); 

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ error: 'Failed to fetch forum posts' });
  }
};

// 2. POST a new message to a locality
export const createForumPost = async (req, res) => {
  try {
    const { locality, author_name, author_role, content } = req.body;
    
    const { data, error } = await supabase
      .from('forum_posts')
      .insert([{ locality, author_name, author_role, content }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error posting to forum:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
};
