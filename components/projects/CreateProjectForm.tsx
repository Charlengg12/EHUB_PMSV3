import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { X, Plus, CalendarIcon, Building, CheckCircle2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Project, User } from '../../types';
import { ClientCreationDialog } from '../client/ClientCreationDialog';

interface CreateProjectFormProps {
  currentUser: User;
  users: User[];
  onCreateProject: (project: Omit<Project, 'id'>) => void | Promise<void> | Promise<Project>;
  onClientCreated: (client: User) => void;
  onClose: () => void;
}

export function CreateProjectForm({ currentUser, users, onCreateProject, onClientCreated, onClose }: CreateProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    priority: 'medium' as Project['priority'],
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    supervisorId: '',
    fabricatorIds: [] as string[],
    budget: '',
    revenue: '',
    documentationUrl: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [showClientDialog, setShowClientDialog] = useState(false);

  const supervisors = users.filter(u => u.role === 'supervisor');
  const fabricators = users.filter(u => u.role === 'fabricator');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.supervisorId) {
      newErrors.supervisorId = 'Supervisor selection is required';
    }

    if (formData.fabricatorIds.length === 0) {
      newErrors.fabricatorIds = 'At least one fabricator must be assigned';
    }

    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Valid budget amount is required';
    }

    if (!formData.revenue || parseFloat(formData.revenue) <= 0) {
      newErrors.revenue = 'Valid revenue amount is required';
    }

    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddFabricator = (fabricatorId: string) => {
    if (!formData.fabricatorIds.includes(fabricatorId)) {
      handleInputChange('fabricatorIds', [...formData.fabricatorIds, fabricatorId]);
    }
  };

  const handleRemoveFabricator = (fabricatorId: string) => {
    handleInputChange('fabricatorIds', formData.fabricatorIds.filter(id => id !== fabricatorId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newProject: Omit<Project, 'id'> = {
      name: formData.name,
      description: formData.description,
      clientName: formData.clientName,
      status: 'planning',
      priority: formData.priority,
      startDate: formData.startDate.toISOString().split('T')[0],
      endDate: formData.endDate.toISOString().split('T')[0],
      progress: 0,
      supervisorId: formData.supervisorId,
      fabricatorIds: formData.fabricatorIds,
      budget: parseFloat(formData.budget),
      spent: 0,
      revenue: parseFloat(formData.revenue),
      documentationUrl: formData.documentationUrl || undefined,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      fabricatorBudgets: []
    };

    // Create project and wait for it to get an ID
    const result = await onCreateProject(newProject);
    
    // If result is a Project, use it; otherwise create a temp project
    const projectWithId = (result && typeof result === 'object' && 'id' in result) 
      ? result as Project
      : { ...newProject, id: `project-${Date.now()}` } as Project;
    
    setCreatedProject(projectWithId);
  };

  const handleCreateClient = () => {
    setShowClientDialog(true);
  };

  const handleSkipClient = () => {
    setCreatedProject(null);
    onClose();
  };

  const handleClientCreated = (client: User) => {
    onClientCreated(client);
    setShowClientDialog(false);
    setCreatedProject(null);
    onClose();
  };

  const getFabricatorName = (id: string) => {
    return users.find(u => u.id === id)?.name || 'Unknown';
  };

  // If project was created, show client creation prompt
  if (createdProject && !showClientDialog) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle>Project Created Successfully!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="mb-2">{createdProject.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Client: {createdProject.clientName}
                </p>
              </div>

              <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-3">
                <UserPlus className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Create Client Account?</p>
                  <p className="text-sm text-muted-foreground">
                    Allow your client to track project progress and view documentation
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkipClient} className="flex-1">
                  Skip for Now
                </Button>
                <Button onClick={handleCreateClient} className="flex-1">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Client Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {showClientDialog && (
          <ClientCreationDialog
            open={showClientDialog}
            onClose={() => {
              setShowClientDialog(false);
              setCreatedProject(null);
              onClose();
            }}
            project={createdProject}
            onClientCreated={handleClientCreated}
          />
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Create New Project
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3>Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter project name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Enter client name"
                    className={errors.clientName ? 'border-destructive' : ''}
                  />
                  {errors.clientName && <p className="text-sm text-destructive">{errors.clientName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter project description"
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Project['priority']) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3>Timeline</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.startDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => {
                          if (date) {
                            handleInputChange('startDate', date);
                            setShowStartCalendar(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.endDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => {
                          if (date) {
                            handleInputChange('endDate', date);
                            setShowEndCalendar(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            {/* Team Assignment */}
            <div className="space-y-4">
              <h3>Team Assignment</h3>
              
              <div className="space-y-2">
                <Label htmlFor="supervisor">Supervisor *</Label>
                <Select
                  value={formData.supervisorId}
                  onValueChange={(value) => handleInputChange('supervisorId', value)}
                >
                  <SelectTrigger className={errors.supervisorId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map(supervisor => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} - {supervisor.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supervisorId && <p className="text-sm text-destructive">{errors.supervisorId}</p>}
              </div>

              <div className="space-y-2">
                <Label>Fabricators *</Label>
                <Select onValueChange={handleAddFabricator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add fabricators" />
                  </SelectTrigger>
                  <SelectContent>
                    {fabricators
                      .filter(fab => !formData.fabricatorIds.includes(fab.id))
                      .map(fabricator => (
                        <SelectItem key={fabricator.id} value={fabricator.id}>
                          {fabricator.name} - {fabricator.department}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                {formData.fabricatorIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.fabricatorIds.map(id => (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        {getFabricatorName(id)}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveFabricator(id)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                {errors.fabricatorIds && <p className="text-sm text-destructive">{errors.fabricatorIds}</p>}
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3>Financial Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">Total Budget * (₱)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="0.00"
                    className={errors.budget ? 'border-destructive' : ''}
                  />
                  {errors.budget && <p className="text-sm text-destructive">{errors.budget}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenue">Expected Revenue * (₱)</Label>
                  <Input
                    id="revenue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.revenue}
                    onChange={(e) => handleInputChange('revenue', e.target.value)}
                    placeholder="0.00"
                    className={errors.revenue ? 'border-destructive' : ''}
                  />
                  {errors.revenue && <p className="text-sm text-destructive">{errors.revenue}</p>}
                </div>
              </div>
            </div>

            {/* Documentation */}
            <div className="space-y-4">
              <h3>Documentation (Optional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="documentationUrl">Google Drive Documentation URL</Label>
                <Input
                  id="documentationUrl"
                  type="url"
                  value={formData.documentationUrl}
                  onChange={(e) => handleInputChange('documentationUrl', e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                />
              </div>
            </div>

            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  Please fix the errors above before submitting.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}