import { supabase } from '@/integrations/supabase/client';

type ImportResponse<T = unknown> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
  stats?: {
    discovered?: number;
    already_queued?: number;
    already_imported?: number;
    new_to_queue?: number;
  };
  results?: {
    success: number;
    failed: number;
    imported?: number;
    errors: string[];
  };
};

export const recipeImportApi = {
  /**
   * Discover recipe URLs from ICA and add to import queue
   */
  async discover(options?: { limit?: number; search?: string }): Promise<ImportResponse> {
    const { data, error } = await supabase.functions.invoke('recipe-discover', {
      body: options || {},
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Scrape pending recipes from the queue
   */
  async scrape(options?: { batchSize?: number }): Promise<ImportResponse> {
    const { data, error } = await supabase.functions.invoke('recipe-scrape', {
      body: options || {},
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Parse scraped recipes with AI and import to database
   */
  async parse(options?: { batchSize?: number }): Promise<ImportResponse> {
    const { data, error } = await supabase.functions.invoke('recipe-parse', {
      body: options || {},
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Get import queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const { data, error } = await supabase
      .from('recipe_import_queue')
      .select('status');

    if (error || !data) {
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }

    const counts = data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      pending: counts['pending'] || 0,
      processing: counts['processing'] || 0,
      completed: counts['completed'] || 0,
      failed: counts['failed'] || 0,
      total: data.length,
    };
  },

  /**
   * Get failed imports for review
   */
  async getFailedImports(limit = 50) {
    const { data, error } = await supabase
      .from('recipe_import_queue')
      .select('*')
      .eq('status', 'failed')
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching failed imports:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Retry a failed import
   */
  async retryFailed(id: string): Promise<ImportResponse> {
    const { error } = await supabase
      .from('recipe_import_queue')
      .update({ status: 'pending', error_message: null })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, message: 'Import marked for retry' };
  },

  /**
   * Clear all failed imports
   */
  async clearFailed(): Promise<ImportResponse> {
    const { error } = await supabase
      .from('recipe_import_queue')
      .delete()
      .eq('status', 'failed');

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, message: 'Failed imports cleared' };
  },
};
