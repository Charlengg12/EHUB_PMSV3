<?php

// Simple PHP API router to replace Node/Express backend

require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// Determine the base path (e.g. "/api") and trim it from the URI
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
if ($scriptDir !== '' && strpos($requestUri, $scriptDir) === 0) {
    $path = substr($requestUri, strlen($scriptDir));
} else {
    $path = $requestUri;
}
$path = '/' . trim($path, '/');

// Basic routing
switch ($method . ' ' . $path) {
    case 'GET /health':
        json_response([
            'status' => 'ok',
            'timestamp' => gmdate('c'),
        ]);
        break;

    case 'POST /auth/login':
        handle_login($pdo);
        break;

    case 'POST /auth/signup':
        handle_signup($pdo);
        break;

    case 'GET /projects':
        handle_get_projects($pdo);
        break;

    case 'POST /projects':
        handle_create_project($pdo);
        break;

    case 'GET /tasks':
        handle_get_tasks($pdo);
        break;

    case 'POST /tasks':
        handle_create_task($pdo);
        break;

    case 'GET /worklogs':
        handle_get_worklogs($pdo);
        break;

    case 'POST /worklogs':
        handle_create_worklog($pdo);
        break;

    case 'GET /materials':
        handle_get_materials($pdo);
        break;

    case 'POST /materials':
        handle_create_material($pdo);
        break;

    case 'GET /users':
        handle_get_users($pdo);
        break;

    case 'POST /users/client':
        handle_create_client($pdo);
        break;

    case 'POST /auth/logout':
        handle_logout();
        break;

    case 'GET /auth/me':
        handle_me($pdo);
        break;

    default:
        json_response(['error' => 'Not found'], 404);
}

// --- Handlers ---

function handle_login(PDO $pdo): void
{
    $body = sanitize_recursive(json_input());
    $identifier = $body['identifier'] ?? '';
    $password = $body['password'] ?? '';

    if ($identifier === '' || $password === '') {
        json_response(['error' => 'Identifier and password are required'], 400);
    }

    // Try to match by email, secure_id or employee_number
    $stmt = $pdo->prepare(
        'SELECT * FROM users WHERE (secure_id = :id OR employee_number = :id OR email = :id) AND is_active = 1 LIMIT 1'
    );
    $stmt->execute([':id' => $identifier]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['error' => 'User not found'], 404);
    }

    if (!password_verify($password, $user['password_hash'])) {
        json_response(['error' => 'Invalid password'], 401);
    }

    // Establish PHP session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];

    // For frontend compatibility, still return a token string
    $token = base64_encode(random_bytes(32));

    unset($user['password_hash']);

    json_response([
        'user' => $user,
        'token' => $token,
    ]);
}

function handle_signup(PDO $pdo): void
{
    $body = sanitize_recursive(json_input());

    $email = isset($body['email']) ? trim(strtolower($body['email'])) : '';
    $password = $body['password'] ?? '';
    $name = trim($body['name'] ?? '');

    if ($email === '' || $password === '' || $name === '') {
        json_response(['error' => 'Email, password, and name are required'], 400);
    }

    // Check existing user
    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        json_response(['error' => 'User already exists with this email'], 409);
    }

    $secureId = 'FAB' . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));
    $employeeNumber = 'EMP' . substr((string)time(), -6) . str_pad((string)random_int(0, 999), 3, '0', STR_PAD_LEFT);
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $userId = 'user-' . time();

    $stmt = $pdo->prepare(
        'INSERT INTO users (id, name, email, password_hash, role, school, phone, gcash_number, secure_id, employee_number, is_active)
         VALUES (:id, :name, :email, :password_hash, :role, :school, :phone, :gcash_number, :secure_id, :employee_number, 1)'
    );
    $stmt->execute([
        ':id' => $userId,
        ':name' => $name,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':role' => 'fabricator',
        ':school' => $body['school'] ?? null,
        ':phone' => $body['phone'] ?? null,
        ':gcash_number' => $body['gcashNumber'] ?? null,
        ':secure_id' => $secureId,
        ':employee_number' => $employeeNumber,
    ]);

    $user = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => 'fabricator',
        'school' => $body['school'] ?? null,
        'phone' => $body['phone'] ?? null,
        'gcash_number' => $body['gcashNumber'] ?? null,
        'secure_id' => $secureId,
        'employee_number' => $employeeNumber,
        'is_active' => 1,
    ];

    // Auto-login new user into session
    $_SESSION['user_id'] = $userId;
    $_SESSION['role'] = 'fabricator';

    $token = base64_encode(random_bytes(32));

    json_response([
        'user' => $user,
        'token' => $token,
    ]);
}

function handle_logout(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
    json_response(['message' => 'Logged out']);
}

function handle_me(PDO $pdo): void
{
    if (empty($_SESSION['user_id'])) {
        json_response(['user' => null]);
    }
    $stmt = $pdo->prepare('SELECT id, name, email, role, school, phone, gcash_number, secure_id, employee_number, is_active, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['user' => null]);
    }
    json_response(['user' => $user]);
}

function handle_get_projects(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM projects ORDER BY created_at DESC');
    $projects = $stmt->fetchAll();
    json_response($projects);
}

function handle_create_project(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());

    $projectId = 'project-' . time();

    $title = $body['name'] ?? $body['title'] ?? null;
    if (!$title) {
        json_response(['error' => 'Project title is required'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO projects (id, title, description, status, priority, progress, start_date, due_date, budget, client_id, supervisor_id, fabricator_ids)
         VALUES (:id, :title, :description, :status, :priority, :progress, :start_date, :due_date, :budget, :client_id, :supervisor_id, :fabricator_ids)'
    );

    $stmt->execute([
        ':id' => $projectId,
        ':title' => $title,
        ':description' => $body['description'] ?? null,
        ':status' => $body['status'] ?? 'planning',
        ':priority' => $body['priority'] ?? 'medium',
        ':progress' => $body['progress'] ?? 0,
        ':start_date' => $body['startDate'] ?? null,
        ':due_date' => $body['endDate'] ?? ($body['dueDate'] ?? null),
        ':budget' => $body['budget'] ?? null,
        ':client_id' => $body['clientId'] ?? null,
        ':supervisor_id' => $body['supervisorId'] ?? null,
        ':fabricator_ids' => isset($body['fabricatorIds']) ? json_encode($body['fabricatorIds']) : json_encode([]),
    ]);

    $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch();

    json_response($project);
}

function handle_get_tasks(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM tasks ORDER BY created_at DESC');
    $tasks = $stmt->fetchAll();
    json_response($tasks);
}

function handle_create_task(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $taskId = 'task-' . time();

    if (empty($body['projectId']) || empty($body['title'])) {
        json_response(['error' => 'projectId and title are required'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO tasks (id, project_id, title, description, status, priority, assigned_to, created_by, due_date, estimated_hours, actual_hours)
         VALUES (:id, :project_id, :title, :description, :status, :priority, :assigned_to, :created_by, :due_date, :estimated_hours, :actual_hours)'
    );

    $stmt->execute([
        ':id' => $taskId,
        ':project_id' => $body['projectId'],
        ':title' => $body['title'],
        ':description' => $body['description'] ?? null,
        ':status' => $body['status'] ?? 'pending',
        ':priority' => $body['priority'] ?? 'medium',
        ':assigned_to' => $body['assignedTo'] ?? null,
        ':created_by' => $body['createdBy'] ?? null,
        ':due_date' => $body['dueDate'] ?? null,
        ':estimated_hours' => $body['estimatedHours'] ?? 0,
        ':actual_hours' => $body['actualHours'] ?? 0,
    ]);

    $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $taskId]);
    $task = $stmt->fetch();

    json_response($task);
}

function handle_get_worklogs(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM work_logs ORDER BY created_at DESC');
    $logs = $stmt->fetchAll();
    json_response($logs);
}

function handle_create_worklog(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $workLogId = 'wl-' . time();

    if (empty($body['projectId']) || empty($body['userId']) || empty($body['date']) || !isset($body['hoursWorked'])) {
        json_response(['error' => 'projectId, userId, date, and hoursWorked are required'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO work_logs (id, project_id, user_id, date, hours_worked, description, progress_percentage)
         VALUES (:id, :project_id, :user_id, :date, :hours_worked, :description, :progress_percentage)'
    );

    $stmt->execute([
        ':id' => $workLogId,
        ':project_id' => $body['projectId'],
        ':user_id' => $body['userId'],
        ':date' => $body['date'],
        ':hours_worked' => $body['hoursWorked'],
        ':description' => $body['description'] ?? null,
        ':progress_percentage' => $body['progressPercentage'] ?? 0,
    ]);

    $stmt = $pdo->prepare('SELECT * FROM work_logs WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $workLogId]);
    $log = $stmt->fetch();

    json_response($log);
}

function handle_get_materials(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM materials ORDER BY added_at DESC');
    $materials = $stmt->fetchAll();
    json_response($materials);
}

function handle_create_material(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $materialId = 'mat-' . time();

    if (empty($body['projectId']) || empty($body['name']) || !isset($body['quantity'])) {
        json_response(['error' => 'projectId, name, and quantity are required'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO materials (id, project_id, name, description, quantity, unit, cost_per_unit, total_cost)
         VALUES (:id, :project_id, :name, :description, :quantity, :unit, :cost_per_unit, :total_cost)'
    );

    $stmt->execute([
        ':id' => $materialId,
        ':project_id' => $body['projectId'],
        ':name' => $body['name'],
        ':description' => $body['description'] ?? null,
        ':quantity' => $body['quantity'],
        ':unit' => $body['unit'] ?? null,
        ':cost_per_unit' => $body['costPerUnit'] ?? null,
        ':total_cost' => $body['totalCost'] ?? null,
    ]);

    $stmt = $pdo->prepare('SELECT * FROM materials WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $materialId]);
    $material = $stmt->fetch();

    json_response($material);
}

function handle_get_users(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query(
        'SELECT id, name, email, role, school, phone, gcash_number, secure_id, employee_number, is_active, created_at
         FROM users ORDER BY created_at DESC'
    );
    $users = $stmt->fetchAll();
    json_response($users);
}

function handle_create_client(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());

    $name = trim($body['name'] ?? '');
    $email = isset($body['email']) ? trim(strtolower($body['email'])) : '';
    $password = $body['password'] ?? '';
    $projectId = $body['projectId'] ?? null;
    $projectName = $body['projectName'] ?? null;

    if ($name === '' || $email === '' || $password === '' || !$projectId) {
        json_response(['error' => 'Name, email, password, and projectId are required'], 400);
    }

    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        json_response(['error' => 'User already exists with this email'], 409);
    }

    $secureId = 'CLI' . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $userId = 'user-' . time();

    $stmt = $pdo->prepare(
        'INSERT INTO users (id, name, email, password_hash, role, school, phone, secure_id, client_project_id, is_active)
         VALUES (:id, :name, :email, :password_hash, :role, :school, :phone, :secure_id, :client_project_id, 1)'
    );

    $stmt->execute([
        ':id' => $userId,
        ':name' => $name,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':role' => 'client',
        ':school' => $projectName,
        ':phone' => $body['phone'] ?? null,
        ':secure_id' => $secureId,
        ':client_project_id' => $projectId,
    ]);

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    unset($user['password_hash']);

    json_response(['user' => $user]);
}


