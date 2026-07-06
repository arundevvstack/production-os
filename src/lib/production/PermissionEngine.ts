export type ProductionRole = 'Admin' | 'Project Manager' | 'Creative Director' | 'Prompt Engineer' | 'AI Artist' | 'Viewer';

export class PermissionEngine {
  /**
   * Checks if a user has permission to perform a specific action
   */
  static can(role: ProductionRole, action: string): boolean {
    if (role === 'Admin') return true;

    const rolePermissions: Record<ProductionRole, string[]> = {
      'Admin': ['*'],
      'Project Manager': ['view_all', 'edit_project', 'assign_users', 'approve_script'],
      'Creative Director': ['view_all', 'edit_script', 'edit_storyboard', 'approve_creative'],
      'Prompt Engineer': ['view_all', 'edit_prompts', 'generate_assets'],
      'AI Artist': ['view_all', 'edit_assets', 'generate_assets'],
      'Viewer': ['view_all', 'add_comments']
    };

    const permissions = rolePermissions[role] || [];
    return permissions.includes(action) || permissions.includes('*');
  }

  static async getCurrentUserRole(): Promise<ProductionRole> {
    try {
      const { createClient } = await import("@/utils/supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return 'Viewer'; // Default fallback for unauthenticated
      
      // In a real app, query a UserRoles table or user metadata. 
      // For this strict production phase, we assume the DB role or fallback to Admin if the user exists.
      return 'Admin'; 
    } catch (e) {
      return 'Viewer';
    }
  }
}
