import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Calendar, DollarSign, Users, Building, FileText, Link, Paperclip, Plus, UserPlus, Edit, CheckCircle } from 'lucide-react';
import { Project, User } from '../../types';
import { CreateProjectForm } from './CreateProjectForm';
import { ProjectDetails } from './ProjectDetails';
import { emailService } from '../../utils/emailService';

interface ProjectsGridProps {
  projects: Project[];
  users: User[];
  currentUser: User;
  onCreateProject?: (project: Omit<Project, 'id'>) => void | Promise<void> | Promise<Project>;
  onAssignFabricator?: (projectId: string, fabricatorId: string, message?: string) => void;
  onUpdateProject?: (project: Project) => void;
  onCreateUser?: (user: User) => void;
}

export function ProjectsGrid({ projects, users, currentUser, onCreateProject, onAssignFabricator, onUpdateProject, onCreateUser }: ProjectsGridProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFabricatorId, setSelectedFabricatorId] = useState('');
  const [assignMessage, setAssignMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  const getFilteredProjects = () => {
    if (currentUser.role === 'admin') {
      return projects;
    }
    if (currentUser.role === 'supervisor') {
      return projects.filter(p => p.supervisorId === currentUser.id);
    }
    return projects.filter(p => p.fabricatorIds.includes(currentUser.id));
  };

  const filteredProjects = getFilteredProjects();

  // Get available fabricators for assignment (exclude already assigned ones)
  const getAvailableFabricators = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    
    return users.filter(u => 
      u.role === 'fabricator' && 
      !project.fabricatorIds.includes(u.id) &&
      !project.pendingAssignments?.some(pa => pa.fabricatorId === u.id && pa.status === 'pending')
    );
  };

  const handleAssignFabricator = () => {
    if (onAssignFabricator && selectedProjectId && selectedFabricatorId) {
      onAssignFabricator(selectedProjectId, selectedFabricatorId, assignMessage || undefined);
      setShowAssignForm(false);
      setSelectedProjectId('');
      setSelectedFabricatorId('');
      setAssignMessage('');
    }
  };

  const canCreateProject = (currentUser.role === 'admin' || currentUser.role === 'supervisor');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'planning':
        return 'outline';
      case 'review':
        return 'destructive';
      case 'on-hold':
        return 'destructive';
      case 'pending-assignment':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSupervisorName = (supervisorId: string) => {
    const supervisor = users.find(u => u.id === supervisorId);
    return supervisor?.name || 'Unknown Supervisor';
  };

  const getFabricatorNames = (fabricatorIds: string[]) => {
    return fabricatorIds
      .map(id => users.find(u => u.id === id)?.name || 'Unknown')
      .join(', ');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFabricatorBudget = (project: Project, fabricatorId: string) => {
    return project.fabricatorBudgets?.find(fb => fb.fabricatorId === fabricatorId);
  };

  const handleCreateProject = async (project: Omit<Project, 'id'>) => {
    let result;
    if (onCreateProject) {
      result = await onCreateProject(project);
    }
    setShowCreateForm(false);
    return result;
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    if (onUpdateProject) {
      onUpdateProject(updatedProject);
      // Send email notification about project update
      emailService.sendProjectUpdate(updatedProject, users, 'progress_update', currentUser);
    }
  };

  const handleMarkProjectAsDone = (project: Project) => {
    if (onUpdateProject) {
      const updatedProject = {
        ...project,
        status: 'completed' as const,
        progress: 100
      };
      onUpdateProject(updatedProject);
      // Send email notification about project completion
      emailService.sendProjectUpdate(updatedProject, users, 'status_change', currentUser);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your projects</p>
        </div>
        {canCreateProject && (
          <Button onClick={() => setShowCreateForm(true)} className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md overflow-hidden group">
            <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
            <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={getStatusColor(project.status)} className="text-xs">
                    {project.status}
                  </Badge>
                  <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                    {project.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span className="truncate">
                    Client: {project.clientName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(project.startDate).toLocaleDateString()} - {' '}
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Role-based financial information */}
                {currentUser.role === 'fabricator' && (
                  <div className="space-y-1">
                    {(() => {
                      const fabricatorBudget = getFabricatorBudget(project, currentUser.id);
                      if (fabricatorBudget) {
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              <span>My Budget: ₱{fabricatorBudget.allocatedAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              <span>Spent: ₱{fabricatorBudget.spentAmount.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-muted-foreground ml-5">
                              {fabricatorBudget.description}
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3" />
                            <span>Project Value: ₱{project.revenue.toLocaleString()}</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {currentUser.role === 'supervisor' && (
                  <>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        Budget: ₱{project.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        Spent: ₱{project.spent.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}

                {currentUser.role === 'admin' && (
                  <>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        Revenue: ₱{project.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        Budget: ₱{project.budget.toLocaleString()} | Spent: ₱{project.spent.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span className="truncate">
                    Supervisor: {getSupervisorName(project.supervisorId)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span className="truncate">
                    Team: {getFabricatorNames(project.fabricatorIds)}
                  </span>
                </div>

                {/* Documentation Link */}
                {project.documentationUrl && (
                  <div className="flex items-center gap-2">
                    <Link className="h-3 w-3" />
                    <a
                      href={project.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      Google Drive Documentation
                    </a>
                  </div>
                )}

                {/* File Attachments */}
                {project.attachments && project.attachments.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-3 w-3" />
                      <span>Attachments ({project.attachments.length})</span>
                    </div>
                    <div className="ml-5 space-y-1">
                      {project.attachments.slice(0, 2).map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-1 text-xs">
                          <FileText className="h-3 w-3" />
                          <span className="truncate">{attachment.name}</span>
                          <span className="text-muted-foreground">
                            ({formatFileSize(attachment.size)})
                          </span>
                        </div>
                      ))}
                      {project.attachments.length > 2 && (
                        <div className="text-xs text-muted-foreground ml-4">
                          +{project.attachments.length - 2} more files
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Created by information */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">
                    Created by: {users.find(u => u.id === project.createdBy)?.name || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewDetails(project)}
                >
                  View Details
                </Button>
                {(currentUser.role === 'admin' || 
                  (currentUser.role === 'supervisor' && project.supervisorId === currentUser.id) ||
                  (currentUser.role === 'fabricator' && project.createdBy === currentUser.id)) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(project)}
                  >
                    Edit
                  </Button>
                )}
                {currentUser.role === 'supervisor' && project.supervisorId === currentUser.id && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setShowAssignForm(true);
                    }}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                )}
                {/* Mark as Done Button */}
                {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && 
                 project.status !== 'completed' && (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleMarkProjectAsDone(project)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Mark as Done
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {currentUser.role === 'admin' 
                  ? 'Create your first project to get started.'
                  : currentUser.role === 'supervisor'
                  ? 'Create your first project to get started.'
                  : 'Wait for project assignments from your supervisor.'
                }
              </p>
              {canCreateProject && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <CreateProjectForm
          currentUser={currentUser}
          users={users}
          onCreateProject={handleCreateProject}
          onClientCreated={onCreateUser || (() => {})}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {showAssignForm && (
        <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Fabricator to Project</DialogTitle>
              <DialogDescription>
                Select a fabricator to assign to this project and send them a message.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fabricatorId">Select Fabricator</Label>
                <Select value={selectedFabricatorId} onValueChange={setSelectedFabricatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a fabricator" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableFabricators(selectedProjectId).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.secureId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignMessage">Message (optional)</Label>
                <Textarea
                  id="assignMessage"
                  value={assignMessage}
                  onChange={(e) => setAssignMessage(e.target.value)}
                  placeholder="Add a message for the fabricator about this project assignment..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAssignForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignFabricator}
                  disabled={!selectedFabricatorId}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showProjectDetails && selectedProject && (
        <ProjectDetails
          project={selectedProject}
          users={users}
          currentUser={currentUser}
          onUpdateProject={handleUpdateProject}
          onClose={() => setShowProjectDetails(false)}
        />
      )}
    </div>
  );
}