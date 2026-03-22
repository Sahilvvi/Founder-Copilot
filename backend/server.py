from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
try:
    from mongomock_motor import AsyncMongoMockClient as AsyncIOMotorClient
except ImportError:
    from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import re
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'go_get_it')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class GenerateRequest(BaseModel):
    prompt: str
    modifier: Optional[str] = None  # "aggressive", "budget", "regenerate"
    context: Optional[str] = None  # Previous query for context

# ============================================
# TEAM MEMBER MODELS
# ============================================
class TeamMemberBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = ""
    avatar: Optional[str] = None
    color: Optional[str] = None

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None

class TeamMember(TeamMemberBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Owner of this team member
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============================================
# TASK MODELS
# ============================================
class CommentBase(BaseModel):
    text: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None

class Comment(CommentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    time: str = "Just now"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskBase(BaseModel):
    text: str
    status: str = "todo"  # todo, in_progress, done, delayed
    priority: str = "medium"  # high, medium, low
    assignee: Optional[str] = None  # team member id
    due_date: Optional[str] = None
    completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    text: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None

class Task(TaskBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Owner of this task
    comments: List[Comment] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddCommentRequest(BaseModel):
    text: str
    user_name: Optional[str] = None

class ActionItem(BaseModel):
    action: str
    reason: str
    outcome: str

class ExecutionStep(BaseModel):
    step: str
    result: str

class GenerateResponse(BaseModel):
    strategy: List[str]
    actions: List[ActionItem]
    risks: List[str]
    execution_plan: List[ExecutionStep]
    refinements: List[str]
    confidence: str
    insight: str

class GuardrailResponse(BaseModel):
    error: str
    is_out_of_scope: bool = True

# Guardrail keywords for startup/business topics
ALLOWED_TOPICS = [
    "startup", "business", "growth", "strategy", "execution", "plan", "sales",
    "marketing", "product", "launch", "funnel", "revenue", "customer", "user",
    "acquisition", "retention", "mvp", "validation", "idea", "market", "compete",
    "pricing", "monetization", "scale", "fundraising", "investor", "pitch",
    "team", "hiring", "culture", "metrics", "kpi", "goal", "objective", "okr",
    "roadmap", "milestone", "budget", "cost", "profit", "margin", "conversion",
    "saas", "b2b", "b2c", "enterprise", "smb", "churn", "ltv", "cac", "arpu",
    "weekly", "monthly", "quarterly", "annual", "target", "forecast", "pipeline",
    "lead", "prospect", "deal", "close", "onboard", "feature", "release", "sprint",
    "agile", "lean", "pivot", "iterate", "experiment", "hypothesis", "test",
    "validate", "grow", "expand", "optimize", "improve", "increase", "reduce",
    "automate", "streamline", "efficiency", "productivity", "performance",
    "brand", "position", "differentiate", "compete", "advantage", "moat",
    "network", "partnership", "alliance", "distribution", "channel", "outreach",
    "content", "seo", "sem", "social", "email", "campaign", "ad", "creative",
    "copy", "landing", "website", "app", "platform", "tool", "service", "offer"
]

# Explicitly blocked topics
BLOCKED_PATTERNS = [
    r"\bjoke\b", r"\bpoem\b", r"\bstory\b", r"\bsong\b", r"\brecipe\b",
    r"\bweather\b", r"\bsports\b", r"\bmovie\b", r"\bgame\b", r"\bmusic\b",
    r"\bpolitics\b", r"\breligion\b", r"\bdating\b", r"\blove\b", r"\brelationship\b",
    r"\bhoroscope\b", r"\bastrology\b", r"\bfortune\b", r"\blottery\b",
    r"\bcasino\b", r"\bgambling\b", r"\bbet\b", r"\bcrypto\s*trading\b",
    r"\bhello\b.*\bhow are you\b", r"\bwho are you\b", r"\bwhat are you\b",
    r"\btell me about yourself\b", r"\bwrite me a\b", r"\bcreate a\b.*\bfor fun\b",
    r"\bcode\b.*\bpython\b", r"\bcode\b.*\bjavascript\b", r"\bprogram\b",
    r"\bhelp me with homework\b", r"\bmath problem\b", r"\bsolve\b.*\bequation\b"
]

def is_startup_related(prompt: str) -> bool:
    """Check if the prompt is related to startup/business topics."""
    prompt_lower = prompt.lower()
    
    # Check for blocked patterns first
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, prompt_lower):
            return False
    
    # Check for allowed topic keywords
    for topic in ALLOWED_TOPICS:
        if topic in prompt_lower:
            return True
    
    # Additional heuristic: very short prompts without business context
    if len(prompt.split()) < 3:
        return False
    
    # Default to allowing if no blocked patterns found and prompt is substantial
    return len(prompt.split()) >= 5

# System prompt for the AI
SYSTEM_PROMPT = """You are an elite Founder Copilot — a Chief of Staff AI agent for startup founders.

YOUR ROLE:
- Convert vague goals into structured, actionable execution plans
- Be decisive, practical, and slightly opinionated
- NO generic advice
- NO paragraphs of explanation
- ONLY structured outputs

RESPONSE RULES:
1. Always respond in valid JSON format
2. Be specific and actionable — no fluff
3. Include realistic timeframes and metrics where applicable
4. Consider resource constraints
5. Prioritize high-impact actions

RESPONSE STRUCTURE (MANDATORY):
{
  "strategy": ["Strategic point 1", "Strategic point 2", ...],
  "actions": [
    {"action": "Specific action", "reason": "Why this matters", "outcome": "Expected result"}
  ],
  "risks": ["Risk 1", "Risk 2", ...],
  "execution_plan": [
    {"step": "Step description", "result": "Expected outcome"}
  ],
  "refinements": ["Optimization 1", "Optimization 2", ...],
  "confidence": "High/Medium/Low with brief explanation",
  "insight": "One key insight or non-obvious recommendation"
}

MODIFIERS:
- If user requests "aggressive": Focus on rapid growth, higher risk tolerance, faster timelines
- If user requests "budget": Focus on cost-effective strategies, bootstrapping, lean operations
- If user requests "regenerate": Provide alternative approaches to the same goal"""

async def call_llm(prompt: str, modifier: Optional[str] = None, context: Optional[str] = None) -> dict:
    """Call the LLM with the given prompt with retry logic."""
    import asyncio
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY', 'dummy')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
        
    if api_key == "dummy":
        import asyncio
        await asyncio.sleep(2)
        return {
            "strategy": ["Validate problem-solution fit via early adapters", "Establish local testing loop"],
            "actions": [{"action": "[MOCKED] Built with dummy LLM", "reason": "No valid API key provided to local .env", "outcome": "Provides UI testing functionality"}],
            "risks": ["This is mock data", "Local instance requires valid EMERGENT_LLM_KEY for real plans"],
            "execution_plan": [{"step": "Add real LLM API Key to .env", "result": "Live AI generation functions"}, {"step": "Add real Mongo URI", "result": "Persistent data storage"}],
            "refinements": ["Update parameters in backend/.env to configure"],
            "confidence": "Medium",
            "insight": "Run tests securely with local dummy values!"
        }
    
    # Build the user message - keep it concise for faster response
    user_content = prompt
    if modifier:
        modifier_instructions = {
            "aggressive": " [Focus: rapid growth, higher risk, faster timelines]",
            "budget": " [Focus: cost-effective, lean, bootstrapping]",
            "regenerate": " [Provide a different approach]"
        }
        user_content += modifier_instructions.get(modifier, "")
    
    if context:
        user_content = f"Context: {context[:200]}... Request: {user_content}"
    
    user_content += "\n\nRespond with valid JSON only. Be concise."
    
    user_message = UserMessage(text=user_content)
    
    # Retry logic - try up to 3 times
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=str(uuid.uuid4()),
                system_message=SYSTEM_PROMPT
            ).with_model("openai", "gpt-5.2")
            
            # Add timeout for LLM call
            response = await asyncio.wait_for(
                chat.send_message(user_message),
                timeout=60.0  # 60 second timeout
            )
            
            # Parse the JSON response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
                
        except asyncio.TimeoutError:
            logger.warning(f"LLM call timed out on attempt {attempt + 1}/{max_retries}")
            last_error = "timeout"
            if attempt < max_retries - 1:
                await asyncio.sleep(1)  # Brief pause before retry
                continue
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error on attempt {attempt + 1}/{max_retries}: {e}")
            last_error = "parse_error"
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
        except Exception as e:
            logger.warning(f"LLM error on attempt {attempt + 1}/{max_retries}: {e}")
            last_error = str(e)
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
    
    # All retries failed - return fallback response
    logger.error(f"All {max_retries} LLM attempts failed. Last error: {last_error}")
    
    if last_error == "timeout":
        return {
            "strategy": ["Request timed out - please try a simpler query"],
            "actions": [{"action": "Simplify your query", "reason": "Complex queries take longer", "outcome": "Faster response"}],
            "risks": ["Query complexity may cause delays"],
            "execution_plan": [{"step": "Break down into smaller goals", "result": "Faster execution plans"}],
            "refinements": ["Try focusing on one specific area"],
            "confidence": "N/A - Timeout",
            "insight": "Consider breaking your goal into smaller, specific parts for better results."
        }
    else:
        return {
            "strategy": ["Unable to generate response. Please try again."],
            "actions": [{"action": "Retry query", "reason": "Temporary service issue", "outcome": "Get structured plan"}],
            "risks": ["Service temporarily unavailable"],
            "execution_plan": [{"step": "Click regenerate or submit again", "result": "Fresh execution plan"}],
            "refinements": ["Consider rephrasing your query"],
            "confidence": "N/A - Service issue",
            "insight": "The AI service encountered an issue. Please try again in a moment."
        }

# Routes
@api_router.get("/")
async def root():
    return {"message": "AI Founder Copilot API"}

@api_router.post("/generate")
async def generate_plan(request: GenerateRequest):
    """Generate an execution plan from the user's prompt."""
    
    # Validate input
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    prompt = request.prompt.strip()
    
    # Check guardrails
    if not is_startup_related(prompt):
        return {
            "error": "Out of scope. This assistant only handles startup execution and strategy.",
            "is_out_of_scope": True
        }
    
    try:
        # Call LLM
        result = await call_llm(prompt, request.modifier, request.context)
        return result
    except Exception as e:
        logger.error(f"Error generating plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# TEAM MEMBER ENDPOINTS
# ============================================
@api_router.get("/team/{user_id}")
async def get_team_members(user_id: str):
    """Get all team members for a user."""
    members = await db.team_members.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return members

@api_router.post("/team/{user_id}")
async def create_team_member(user_id: str, member: TeamMemberCreate):
    """Create a new team member."""
    # Generate avatar from name if not provided
    avatar = member.avatar
    if not avatar and member.name:
        avatar = ''.join([n[0] for n in member.name.split()[:2]]).upper()
    
    # Generate random color if not provided
    color = member.color
    if not color:
        colors = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"]
        import random
        color = random.choice(colors)
    
    data = member.model_dump()
    data['avatar'] = avatar
    data['color'] = color
    member_obj = TeamMember(
        **data,
        user_id=user_id
    )
    
    doc = member_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.team_members.insert_one(doc)
    
    # Return without _id
    doc.pop('_id', None)
    return doc

@api_router.put("/team/{user_id}/{member_id}")
async def update_team_member(user_id: str, member_id: str, update: TeamMemberUpdate):
    """Update a team member."""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.team_members.update_one(
        {"id": member_id, "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Fetch and return updated member
    member = await db.team_members.find_one({"id": member_id, "user_id": user_id}, {"_id": 0})
    return member

@api_router.delete("/team/{user_id}/{member_id}")
async def delete_team_member(user_id: str, member_id: str):
    """Delete a team member."""
    result = await db.team_members.delete_one({"id": member_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    return {"message": "Team member deleted", "id": member_id}

# ============================================
# TASK ENDPOINTS
# ============================================
@api_router.get("/tasks/{user_id}")
async def get_tasks(user_id: str):
    """Get all tasks for a user."""
    tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(500)
    return tasks

@api_router.post("/tasks/{user_id}")
async def create_task(user_id: str, task: TaskCreate):
    """Create a new task."""
    task_obj = Task(
        **task.model_dump(),
        user_id=user_id
    )
    
    doc = task_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.tasks.insert_one(doc)
    
    # Return without _id
    doc.pop('_id', None)
    return doc

@api_router.put("/tasks/{user_id}/{task_id}")
async def update_task(user_id: str, task_id: str, update: TaskUpdate):
    """Update a task."""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tasks.update_one(
        {"id": task_id, "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Fetch and return updated task
    task = await db.tasks.find_one({"id": task_id, "user_id": user_id}, {"_id": 0})
    return task

@api_router.delete("/tasks/{user_id}/{task_id}")
async def delete_task(user_id: str, task_id: str):
    """Delete a task."""
    result = await db.tasks.delete_one({"id": task_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted", "id": task_id}

@api_router.post("/tasks/{user_id}/{task_id}/comments")
async def add_comment(user_id: str, task_id: str, comment: AddCommentRequest):
    """Add a comment to a task."""
    new_comment = Comment(
        text=comment.text,
        user_name=comment.user_name or "User"
    )
    
    comment_doc = new_comment.model_dump()
    comment_doc['created_at'] = comment_doc['created_at'].isoformat()
    
    result = await db.tasks.update_one(
        {"id": task_id, "user_id": user_id},
        {
            "$push": {"comments": comment_doc},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Fetch and return updated task
    task = await db.tasks.find_one({"id": task_id, "user_id": user_id}, {"_id": 0})
    return task

# ============================================
# SEED DATA ENDPOINT (for new users)
# ============================================
@api_router.post("/seed/{user_id}")
async def seed_user_data(user_id: str):
    """Seed initial data for a new user (if they have no data)."""
    # Check if user already has data
    existing_tasks = await db.tasks.count_documents({"user_id": user_id})
    existing_members = await db.team_members.count_documents({"user_id": user_id})
    
    if existing_tasks > 0 or existing_members > 0:
        return {"message": "User already has data", "seeded": False}
    
    # Seed team members
    team_members = [
        {"name": "John Doe", "email": "john@startup.com", "role": "Founder", "avatar": "JD", "color": "#6366F1"},
        {"name": "Sarah Kim", "email": "sarah@startup.com", "role": "Co-founder", "avatar": "SK", "color": "#EC4899"},
        {"name": "Mike Chen", "email": "mike@startup.com", "role": "Developer", "avatar": "MC", "color": "#10B981"}
    ]
    
    member_ids = []
    for m in team_members:
        member_obj = TeamMember(**m, user_id=user_id)
        doc = member_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.team_members.insert_one(doc)
        member_ids.append(member_obj.id)
    
    # Seed tasks with dynamic dates
    from datetime import timedelta
    today = datetime.now(timezone.utc).date()
    
    tasks_data = [
        {"text": "Review growth strategy plan", "status": "in_progress", "priority": "high", "assignee": member_ids[0], "due_date": str(today), "completed": False},
        {"text": "Set up analytics tracking", "status": "done", "priority": "medium", "assignee": member_ids[2], "due_date": str(today - timedelta(days=2)), "completed": True},
        {"text": "Schedule customer interviews", "status": "todo", "priority": "high", "assignee": member_ids[1], "due_date": str(today + timedelta(days=1)), "completed": False},
        {"text": "Update pitch deck", "status": "delayed", "priority": "high", "assignee": member_ids[0], "due_date": str(today - timedelta(days=4)), "completed": False},
        {"text": "Review competitor analysis", "status": "done", "priority": "low", "assignee": member_ids[1], "due_date": str(today - timedelta(days=3)), "completed": True},
        {"text": "Prepare demo for investors", "status": "in_progress", "priority": "high", "assignee": member_ids[2], "due_date": str(today + timedelta(days=3)), "completed": False},
        {"text": "Write blog post about launch", "status": "todo", "priority": "low", "assignee": None, "due_date": None, "completed": False},
        {"text": "Finalize marketing copy", "status": "todo", "priority": "medium", "assignee": member_ids[1], "due_date": str(today + timedelta(days=1)), "completed": False}
    ]
    
    for t in tasks_data:
        task_obj = Task(**t, user_id=user_id)
        doc = task_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.tasks.insert_one(doc)
    
    return {"message": "User data seeded successfully", "seeded": True, "team_members": len(team_members), "tasks": len(tasks_data)}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
