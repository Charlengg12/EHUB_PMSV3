import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Building, 
  Link, 
  FileText, 
  Upload, 
  Download,
  ExternalLink,
  Edit,
  Save,
  X
} from 'lucide-react';
import { Project, User, ProjectAttachment } from '../../types';
import { ProjectFileUpload } from './ProjectFileUpload';
import { FabricatorRevenueManager } from './FabricatorRevenueManager';

interface ProjectDetailsProps {
  project: Project;
  users: User[];
  currentUser: User;
  onUpdateProject: (updatedProject: Project) => void;
  onClose: () => void;
}

export function ProjectDetails({ project, users, currentUser, onUpdateProject, onClose }: ProjectDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(project);

  const canEdit = currentUser.role === 'admin' || 
    (currentUser.role === 'supervisor' && project.supervisorId === currentUser.id);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'planning': return 'outline';
      case 'review': return 'destructive';
      case 'on-hold': return 'destructive';
      default: return 'outline';
    }
  };

  const handleSave = () => {
    onUpdateProject(editedProject);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleFilesUploaded = (newAttachments: ProjectAttachment[]) => {
    const updatedProject = {
      ...editedProject,
      attachments: [...(editedProject.attachments || []), ...newAttachments]
    };
    setEditedProject(updatedProject);
    onUpdateProject(updatedProject);
  };

  const handleDocumentationUrlChange = (url: string) => {
    setEditedProject(prev => ({ ...prev, documentationUrl: url }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Badge variant="outline">
                  {project.priority} priority
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && !isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    {isEditing ? (
                      <Input
                        id="description"
                        value={editedProject.description}
                        onChange={(e) => setEditedProject(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Progress</Label>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{project.progress}% Complete</span>
                        {isEditing && (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editedProject.progress}
                            onChange={(e) => setEditedProject(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                            className="w-20 h-6"
                          />
                        )}
                      </div>
                      <Progress value={project.progress} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Start Date
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        End Date
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Client
                    </Label>
                    <p className="text-sm text-muted-foreground">{project.clientName}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg">Financial Overview</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                    <>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Budget</span>
                          </div>
                          <p className="text-2xl">₱{project.budget.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Spent</span>
                          </div>
                          <p className="text-2xl">₱{project.spent.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {currentUser.role === 'fabricator' ? 'Project Value' : 'Revenue'}
                        </span>
                      </div>
                      <p className="text-2xl">₱{project.revenue.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Project Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Supervisor */}
                  <div className="pb-4 border-b">
                    <Label className="flex items-center gap-2 text-base mb-2">
                      Supervisor
                    </Label>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        S
                      </div>
                      <div>
                        <p className="font-medium">{getSupervisorName(project.supervisorId)}</p>
                        <p className="text-sm text-muted-foreground">Project Supervisor</p>
                      </div>
                    </div>
                  </div>

                  {/* Fabricators */}
                  <div>
                    <Label className="flex items-center gap-2 text-base mb-3">
                      Fabricators ({project.fabricatorIds.length})
                    </Label>
                    <div className="space-y-3">
                      {project.fabricatorIds.map((fabId, index) => {
                        const fabricator = users.find(u => u.id === fabId);
                        const fabricatorBudget = project.fabricatorBudgets?.find(fb => fb.fabricatorId === fabId);
                        const hasRevenue = fabricatorBudget && fabricatorBudget.allocatedRevenue > 0;

                        return (
                          <div key={fabId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{fabricator?.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{fabricator?.secureId}</p>
                              </div>
                            </div>
                            {hasRevenue && (currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                              <Badge variant="outline" className="gap-1">
                                <DollarSign className="h-3 w-3" />
                                ₱{fabricatorBudget.allocatedRevenue.toLocaleString()} revenue
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <FabricatorRevenueManager
                project={project}
                users={users}
                currentUser={currentUser}
                onUpdateProject={onUpdateProject}
              />
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6">
              {canEdit && (
                <ProjectFileUpload
                  projectId={project.id}
                  currentUserId={currentUser.id}
                  onFilesUploaded={handleFilesUploaded}
                />
              )}

              {project.attachments && project.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Project Files ({project.attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {project.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4" />
                            <div>
                              <p className="font-medium">{attachment.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(attachment.size)} • 
                                Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(!project.attachments || project.attachments.length === 0) && !canEdit && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg mb-2">No files uploaded</h3>
                      <p className="text-muted-foreground">
                        No files have been uploaded to this project yet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Google Drive Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="docs-url">Documentation URL</Label>
                      <Input
                        id="docs-url"
                        value={editedProject.documentationUrl || ''}
                        onChange={(e) => handleDocumentationUrlChange(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                      />
                    </div>
                  ) : (
                    <>
                      {project.documentationUrl ? (
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Link className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Project Documentation</p>
                              <p className="text-sm text-muted-foreground">
                                Google Drive folder with complete project documentation
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" asChild>
                            <a 
                              href={project.documentationUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg mb-2">No documentation link</h3>
                          <p className="text-muted-foreground">
                            No Google Drive documentation has been added to this project.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentation Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    The Google Drive folder should contain:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Project specifications and requirements</li>
                    <li>• Technical drawings and blueprints</li>
                    <li>• Material lists and supplier information</li>
                    <li>• Quality control checklists</li>
                    <li>• Progress reports and photos</li>
                    <li>• Client communication records</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}