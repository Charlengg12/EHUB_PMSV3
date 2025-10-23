import { User, Project, ProjectAssignment, Task } from '../types';

export interface EmailNotification {
  id: string;
  to: string;
  from: string;
  subject: string;
  content: string;
  type: 'assignment' | 'project_update' | 'task_assignment' | 'general';
  sentAt: string;
  projectId?: string;
  taskId?: string;
}

class EmailService {
  private notifications: EmailNotification[] = [];

  // Send project assignment notification
  async sendProjectAssignment(
    assignment: ProjectAssignment, 
    project: Project, 
    fabricator: User, 
    supervisor: User
  ): Promise<boolean> {
    const notification: EmailNotification = {
      id: `email-${Date.now()}`,
      to: fabricator.email,
      from: supervisor.email,
      subject: `New Project Assignment: ${project.name}`,
      content: `
        <h2>New Project Assignment</h2>
        <p>Hello ${fabricator.name},</p>
        
        <p>You have been assigned to a new project by ${supervisor.name}:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3>${project.name}</h3>
          <p><strong>Description:</strong> ${project.description}</p>
          <p><strong>Client:</strong> ${project.clientName}</p>
          <p><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(project.endDate).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> ${project.priority}</p>
        </div>
        
        ${assignment.message ? `
          <p><strong>Message from supervisor:</strong></p>
          <blockquote style="border-left: 4px solid #0066cc; padding-left: 15px; margin: 15px 0; font-style: italic;">
            ${assignment.message}
          </blockquote>
        ` : ''}
        
        <p>Please log into the Ehub Project Management system to accept or decline this assignment.</p>
        
        <p>Best regards,<br/>
        ${supervisor.name}<br/>
        Ehub Project Management Team</p>
      `,
      type: 'assignment',
      sentAt: new Date().toISOString(),
      projectId: project.id
    };

    this.notifications.push(notification);
    console.log(`📧 Email sent to ${fabricator.email}: ${notification.subject}`);
    return true;
  }

  // Send task assignment notification
  async sendTaskAssignment(
    task: Task,
    project: Project,
    assignee: User,
    assigner: User
  ): Promise<boolean> {
    const notification: EmailNotification = {
      id: `email-${Date.now()}`,
      to: assignee.email,
      from: assigner.email,
      subject: `New Task Assignment: ${task.title}`,
      content: `
        <h2>New Task Assignment</h2>
        <p>Hello ${assignee.name},</p>
        
        <p>You have been assigned a new task by ${assigner.name}:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3>${task.title}</h3>
          <p><strong>Description:</strong> ${task.description}</p>
          <p><strong>Project:</strong> ${project.name}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Estimated Hours:</strong> ${task.estimatedHours}</p>
          ${task.materials ? `<p><strong>Materials:</strong> ${task.materials.join(', ')}</p>` : ''}
        </div>
        
        <p>Please log into the Ehub Project Management system to view task details and update progress.</p>
        
        <p>Best regards,<br/>
        ${assigner.name}<br/>
        Ehub Project Management Team</p>
      `,
      type: 'task_assignment',
      sentAt: new Date().toISOString(),
      projectId: project.id,
      taskId: task.id
    };

    this.notifications.push(notification);
    console.log(`📧 Email sent to ${assignee.email}: ${notification.subject}`);
    return true;
  }

  // Send project update notification
  async sendProjectUpdate(
    project: Project,
    users: User[],
    updateType: 'status_change' | 'progress_update' | 'completion',
    updatedBy: User
  ): Promise<boolean> {
    const recipients = users.filter(u => 
      u.id === project.supervisorId || 
      project.fabricatorIds.includes(u.id) ||
      u.role === 'admin'
    );

    for (const recipient of recipients) {
      const notification: EmailNotification = {
        id: `email-${Date.now()}-${recipient.id}`,
        to: recipient.email,
        from: 'noreply@ehub.com',
        subject: `Project Update: ${project.name}`,
        content: `
          <h2>Project Update</h2>
          <p>Hello ${recipient.name},</p>
          
          <p>There has been an update to project "${project.name}" by ${updatedBy.name}:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>${project.name}</h3>
            <p><strong>Status:</strong> ${project.status}</p>
            <p><strong>Progress:</strong> ${project.progress}%</p>
            <p><strong>Client:</strong> ${project.clientName}</p>
            <p><strong>Updated by:</strong> ${updatedBy.name}</p>
          </div>
          
          <p>Log into the Ehub Project Management system to view full project details.</p>
          
          <p>Best regards,<br/>
          Ehub Project Management Team</p>
        `,
        type: 'project_update',
        sentAt: new Date().toISOString(),
        projectId: project.id
      };

      this.notifications.push(notification);
      console.log(`📧 Email sent to ${recipient.email}: ${notification.subject}`);
    }

    return true;
  }

  // Get all notifications for a user
  getNotificationsForUser(userEmail: string): EmailNotification[] {
    return this.notifications
      .filter(n => n.to === userEmail)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  // Get all notifications (admin only)
  getAllNotifications(): EmailNotification[] {
    return this.notifications
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  // Clear notifications
  clearNotifications(): void {
    this.notifications = [];
  }
}

// Export singleton instance
export const emailService = new EmailService();