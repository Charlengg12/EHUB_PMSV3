import { useState, useEffect } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { FabricatorSignupForm } from './components/auth/FabricatorSignupForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardStats } from './components/dashboard/DashboardStats';
import { ProjectOverview } from './components/dashboard/ProjectOverview';
import { TaskList } from './components/dashboard/TaskList';
import { ProjectsGrid } from './components/projects/ProjectsGrid';
import { ProjectAssignments } from './components/projects/ProjectAssignments';
import { UserManagement } from './components/users/UserManagement';
import { RevenueOverview } from './components/revenue/RevenueOverview';
import { WorkLogManager } from './components/worklog/WorkLogManager';
import { MaterialsManager } from './components/materials/MaterialsManager';
import { TaskManager } from './components/tasks/TaskManager';
import { ReportsManager } from './components/reports/ReportsManager';
import { ProjectArchives } from './components/archives/ProjectArchives';
import { ClientDashboard } from './components/client/ClientDashboard';
import { User, Task, Project, WorkLogEntry, Material, ProjectAssignment } from './types';
import { mockUsers, mockProjects, mockTasks, mockCompanyRevenue, mockWorkLogs, mockMaterials } from './data/mockData';
import { emailService } from './utils/emailService';
import { apiService } from './utils/apiService';
import { useTimeBasedTheme } from './hooks/useTimeBasedTheme';

type ViewType = 'dashboard' | 'projects' | 'tasks' | 'users' | 'materials' | 'reports' | 'settings' | 'team' | 'worklog' | 'revenue' | 'assignments' | 'archives' | 'project-status' | 'documentation';
type AuthView = 'main' | 'fabricator-signup' | 'forgot-password';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [authView, setAuthView] = useState<AuthView>('main');
  const [tasks, setTasks] = useState(mockTasks);
  const [users, setUsers] = useState(mockUsers);
  const [projects, setProjects] = useState(mockProjects);
  const [workLogs, setWorkLogs] = useState(mockWorkLogs);
  const [materials, setMaterials] = useState(mockMaterials);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize time-based theme
  const { isDark, isTransitioning, setTheme, getCurrentTheme } = useTimeBasedTheme();

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if backend is available
        const healthCheck = await apiService.healthCheck();
        if (healthCheck.error) {
          console.warn('Backend not available. Running in demo mode with local data.');
          setIsInitialized(true);
          return;
        }

        // Load data from database
        await loadDataFromDatabase();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        console.warn('Falling back to demo mode with local data.');
        setIsInitialized(true); // Continue with local data
      }
    };

    initializeApp();
  }, []);

  const loadDataFromDatabase = async () => {
    try {
      const [projectsRes, tasksRes, workLogsRes, materialsRes, usersRes] = await Promise.all([
        apiService.getProjects(),
        apiService.getTasks(),
        apiService.getWorkLogs(),
        apiService.getMaterials(),
        apiService.getUsers()
      ]);

      if (projectsRes.data) {
        setProjects(projectsRes.data);
      }

      if (tasksRes.data) {
        setTasks(tasksRes.data);
      }

      if (workLogsRes.data) {
        setWorkLogs(workLogsRes.data);
      }

      if (materialsRes.data) {
        setMaterials(materialsRes.data);
      }

      if (usersRes.data) {
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Failed to load data from database:', error);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    apiService.logout();
    setCurrentUser(null);
    setCurrentView('dashboard');
    setAuthView('main');
  };

  const handleSignup = (newUser: User) => {
    // Add the new user to the users list
    setUsers(prevUsers => [...prevUsers, newUser]);
    // Log them in immediately
    setCurrentUser(newUser);
    setCurrentView('dashboard');
  };

  const handleShowFabricatorSignup = () => {
    setAuthView('fabricator-signup');
  };

  const handleShowForgotPassword = () => {
    setAuthView('forgot-password');
  };

  const handleBackToMain = () => {
    setAuthView('main');
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task
      )
    );
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    try {
      const response = await apiService.createProject(projectData);

      if (response.data) {
        setProjects(prevProjects => [...prevProjects, response.data]);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      // Fallback to local creation
      const newProject: Project = {
        ...projectData,
        id: `project-${Date.now()}`
      };
      setProjects(prevProjects => [...prevProjects, newProject]);
      return newProject;
    }
  };

  const handleAddWorkLog = (workLogData: Omit<WorkLogEntry, 'id' | 'createdAt'>) => {
    const newWorkLog: WorkLogEntry = {
      ...workLogData,
      id: `wl-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setWorkLogs(prevLogs => [...prevLogs, newWorkLog]);

    // Update project progress based on work log
    const progressIncrease = workLogData.progressPercentage;
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === workLogData.projectId
          ? { ...project, progress: Math.min(100, project.progress + progressIncrease) }
          : project
      )
    );
  };

  const handleAddMaterial = (materialData: Omit<Material, 'id' | 'addedAt'>) => {
    const newMaterial: Material = {
      ...materialData,
      id: `mat-${Date.now()}`,
      addedAt: new Date().toISOString()
    };
    setMaterials(prevMaterials => [...prevMaterials, newMaterial]);
  };

  const handleAcceptAssignment = (assignmentId: string, response?: string) => {
    setProjects(prevProjects =>
      prevProjects.map(project => ({
        ...project,
        pendingAssignments: project.pendingAssignments?.map(assignment =>
          assignment.id === assignmentId
            ? {
              ...assignment,
              status: 'accepted' as const,
              response,
              respondedAt: new Date().toISOString()
            }
            : assignment
        ),
        fabricatorIds: project.pendingAssignments?.find(a => a.id === assignmentId && a.status === 'pending')
          ? [...project.fabricatorIds, project.pendingAssignments.find(a => a.id === assignmentId)!.fabricatorId]
          : project.fabricatorIds,
        status: project.pendingAssignments?.find(a => a.id === assignmentId && a.status === 'pending')
          ? 'planning' as const
          : project.status
      }))
    );
  };

  const handleDeclineAssignment = (assignmentId: string, response?: string) => {
    setProjects(prevProjects =>
      prevProjects.map(project => ({
        ...project,
        pendingAssignments: project.pendingAssignments?.map(assignment =>
          assignment.id === assignmentId
            ? {
              ...assignment,
              status: 'declined' as const,
              response,
              respondedAt: new Date().toISOString()
            }
            : assignment
        )
      }))
    );
  };

  const handleAssignFabricator = (projectId: string, fabricatorId: string, message?: string) => {
    const project = projects.find(p => p.id === projectId);
    const fabricator = users.find(u => u.id === fabricatorId);
    const supervisor = currentUser;

    if (!project || !fabricator || !supervisor) return;

    const newAssignment: ProjectAssignment = {
      id: `pa-${Date.now()}`,
      projectId,
      fabricatorId,
      assignedBy: currentUser!.id,
      assignedAt: new Date().toISOString(),
      status: 'pending',
      message
    };

    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId
          ? {
            ...p,
            pendingAssignments: [...(p.pendingAssignments || []), newAssignment],
            status: 'pending-assignment' as const
          }
          : p
      )
    );

    // Send email notification
    emailService.sendProjectAssignment(newAssignment, project, fabricator, supervisor);

    // Create initial tasks for the project when assigning fabricator
    const projectTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        projectId,
        title: 'Project Planning Review',
        description: 'Review project requirements and create detailed work plan',
        status: 'pending',
        priority: 'high',
        assignedTo: fabricatorId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        estimatedHours: 8,
        actualHours: 0,
        createdBy: currentUser.id
      },
      {
        projectId,
        title: 'Material Assessment',
        description: 'Assess and order required materials for the project',
        status: 'pending',
        priority: 'medium',
        assignedTo: fabricatorId,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
        estimatedHours: 4,
        actualHours: 0,
        createdBy: currentUser.id
      }
    ];

    // Add the tasks to the task list
    const newTasks = projectTasks.map(taskData => ({
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setTasks(prevTasks => [...prevTasks, ...newTasks]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      )
    );

    // Send email notification about project update
    if (currentUser) {
      emailService.sendProjectUpdate(updatedProject, users, 'progress_update', currentUser);
    }
  };

  // Handle navigation based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as ViewType;
      if (hash && ['dashboard', 'projects', 'tasks', 'users', 'materials', 'reports', 'settings', 'team', 'worklog', 'revenue', 'assignments', 'archives', 'project-status', 'documentation'].includes(hash)) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Handle initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!currentUser) {
    switch (authView) {
      case 'fabricator-signup':
        return (
          <FabricatorSignupForm
            onSignup={handleSignup}
            onBackToMain={handleBackToMain}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordForm onBackToLogin={handleBackToMain} />
        );

      default:
        return (
          <LoginForm
            onLogin={handleLogin}
            onShowSignup={handleShowFabricatorSignup}
            onShowForgotPassword={handleShowForgotPassword}
          />
        );
    }
  }

  const renderView = () => {
    // Client users get a special dashboard
    if (currentUser.role === 'client') {
      switch (currentView) {
        case 'dashboard':
        case 'project-status':
        case 'documentation':
          return (
            <ClientDashboard
              currentUser={currentUser}
              projects={projects}
              users={users}
              workLogs={workLogs}
              tasks={tasks}
            />
          );
        default:
          return (
            <ClientDashboard
              currentUser={currentUser}
              projects={projects}
              users={users}
              workLogs={workLogs}
              tasks={tasks}
            />
          );
      }
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardStats
              projects={projects}
              tasks={tasks}
              users={users}
              currentUser={currentUser}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <ProjectOverview
                projects={projects}
                currentUser={currentUser}
              />
              <TaskList
                tasks={tasks}
                projects={projects}
                currentUser={currentUser}
                onUpdateTaskStatus={handleUpdateTaskStatus}
              />
            </div>
          </div>
        );

      case 'projects':
        return (
          <ProjectsGrid
            projects={projects}
            users={users}
            currentUser={currentUser}
            onCreateProject={(currentUser.role === 'admin' || currentUser.role === 'supervisor') ? handleCreateProject : undefined}
            onAssignFabricator={currentUser.role === 'supervisor' ? handleAssignFabricator : undefined}
            onUpdateProject={handleUpdateProject}
            onCreateUser={handleSignup}
          />
        );

      case 'archives':
        if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
          return (
            <ProjectArchives
              projects={projects}
              users={users}
              materials={materials}
              workLogs={workLogs}
              currentUser={currentUser}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Project archives are only available for administrators and supervisors.
              </p>
            </div>
          </div>
        );

      case 'assignments':
        if (currentUser.role === 'fabricator') {
          return (
            <ProjectAssignments
              currentUser={currentUser}
              projects={projects}
              users={users}
              onAcceptAssignment={handleAcceptAssignment}
              onDeclineAssignment={handleDeclineAssignment}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Project assignments are only available for fabricators.
              </p>
            </div>
          </div>
        );

      case 'worklog':
        if (currentUser.role === 'fabricator') {
          return (
            <WorkLogManager
              currentUser={currentUser}
              projects={projects}
              workLogs={workLogs}
              materials={materials}
              onAddWorkLog={handleAddWorkLog}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Work logs are only available for fabricators.
              </p>
            </div>
          </div>
        );

      case 'materials':
        if (currentUser.role === 'fabricator') {
          return (
            <MaterialsManager
              currentUser={currentUser}
              projects={projects}
              materials={materials}
              onAddMaterial={handleAddMaterial}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Materials management is only available for fabricators.
              </p>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <RevenueOverview
            projects={projects}
            companyRevenue={mockCompanyRevenue}
            currentUser={currentUser}
          />
        );

      case 'reports':
        return (
          <ReportsManager
            projects={projects}
            users={users}
            tasks={tasks}
            currentUser={currentUser}
          />
        );

      case 'users':
        return (
          <UserManagement
            users={users}
            setUsers={setUsers}
            currentUser={currentUser}
          />
        );

      case 'tasks':
        return (
          <TaskManager
            tasks={tasks}
            projects={projects}
            users={users}
            currentUser={currentUser}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Feature Coming Soon</h3>
              <p className="text-muted-foreground">
                The {currentView} section is under development.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <AppLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      currentTheme={getCurrentTheme()}
      onThemeChange={setTheme}
      isTransitioning={isTransitioning}
    >
      {renderView()}
    </AppLayout>
  );
}