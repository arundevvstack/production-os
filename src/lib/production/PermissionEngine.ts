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

  /**
   * For the prototype, we mock the current user's role
   */
  static getCurrentUserRole(): ProductionRole {
    return 'Admin'; // Mocked for MVP
  }
}
