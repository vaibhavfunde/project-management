 import { recordActivity } from "../libs/index.js";
import { sendEmail } from "../libs/send-email.js";
 import ActivityLog from "../models/activity.js";
import Comment from "../models/comment.js";
import Project from "../models/project.js";
import Task from "../models/task.js";

import User from "../models/user.js";
import Workspace from "../models/workspace.js";

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assignees } =
      req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const workspace = await Workspace.findById(project.workspace);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    const newTask = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignees,
      project: projectId,
      createdBy: req.user._id,
    });

    project.tasks.push(newTask._id);
    await project.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignees", "name profilePicture")
      .populate("watchers", "name profilePicture");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project).populate(
      "members.user",
      "name profilePicture"
    );

    res.status(200).json({ task, project });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


const updateTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const oldTitle = task.title;

    task.title = title;
    await task.save();

    // record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task title from ${oldTitle} to ${title}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


const updateTaskDescription = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const oldDescription =
      task.description.substring(0, 50) +
      (task.description.length > 50 ? "..." : "");
    const newDescription =
      description.substring(0, 50) + (description.length > 50 ? "..." : "");

    task.description = description;
    await task.save();

    // record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task description from ${oldDescription} to ${newDescription}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const oldStatus = task.status;

    task.status = status;
    await task.save();

    // record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task status from ${oldStatus} to ${status}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// const updateTaskAssignees = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { assignees } = req.body;

//     const task = await Task.findById(taskId);

//     if (!task) {
//       return res.status(404).json({
//         message: "Task not found",
//       });
//     }

//     const project = await Project.findById(task.project);

//     if (!project) {
//       return res.status(404).json({
//         message: "Project not found",
//       });
//     }

//     const isMember = project.members.some(
//       (member) => member.user.toString() === req.user._id.toString()
//     );

//     if (!isMember) {
//       return res.status(403).json({
//         message: "You are not a member of this project",
//       });
//     }

//     const oldAssignees = task.assignees;

//     task.assignees = assignees;
//     await task.save();

//     // record activity
//     await recordActivity(req.user._id, "updated_task", "Task", taskId, {
//       description: `updated task assignees from ${oldAssignees.length} to ${assignees.length}`,
//     });

//     // const verificationLink = `${process.env.FRONTEND_URL}/dashboard`;
//     //         const emailBody = `<p>Click <a href="${verificationLink}">here</a> to  your email</p>`;
//     //         const emailSubject = "Verify your email";
    
//     //         const isEmailSend = await sendEmail(task.assignees.email, emailSubject, emailBody);
    
//           //  res.status(201).json({ message: "Verification email sent to your email. Please check and verify your account " });

//     res.status(200).json(task);
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

 // your email utility

const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: "Unauthorized" });

    const oldAssignees = task.assignees;
    task.assignees = assignees;
    await task.save();

    // record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task assignees from ${oldAssignees.length} to ${assignees.length}`,
    });

    // Prepare task link
    const taskLink = `${process.env.FRONTEND_URL}/workspaces/${workspace._id}/projects/${project._id}/tasks/${task._id}`;

    const emailSubject = "New Task Assignment";
    // const emailBody = `
    //   <p>You have been assigned to a new task: <strong>${task.title}</strong>.</p>
    //   <p>Click <a href="${taskLink}">here</a> to view the task.</p>
    // `;

    // Send email to each assignee
    const users = await User.find({ _id: { $in: assignees } });

    const emailBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 8px; background-color: #ffffff;">
    <h2 style="color: #333333;">📌 New Task Assigned</h2>

    <p style="font-size: 14px; color: #555555;">
      Hello ${users.map(user => user.name).join(", ")},
    </p>

    <p style="font-size: 14px; color: #555555;">
      You have been assigned to a new task: <strong>${task.title}</strong> in the project <strong>${project.title}</strong>.
    </p>

    <p style="font-size: 14px; color: #555555;">
      You can view the task by clicking the button below:
    </p>

    <a href="${taskLink}" style="display: inline-block; padding: 10px 16px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">View Task</a>

    <p style="font-size: 12px; color: #999999; margin-top: 30px;">
      You are receiving this email because you have been assigned to the project <strong>${project.title}</strong>.
    </p>
  </div>
`;

    for (const user of users) {
      if (user.email) {
        await sendEmail(user.email, emailSubject, emailBody);
      }
    }

    // for (const userId of assignees) {
    //   const userDoc = await User.findById(userId); // ✅ Fix: define userDoc
    
    //   if (!userDoc) continue;
    
    //   const emailBody = `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 8px; background-color: #ffffff;">
    //       <h2 style="color: #333333;">📌 New Task Assigned</h2>
    
    //       <p style="font-size: 14px; color: #555555;">
    //         Hello ${userDoc.name},
    //       </p>
    
    //       <p style="font-size: 14px; color: #555555;">
    //         You have been assigned to a new task: <strong>${task.title}</strong> in the project <strong>${project.title}</strong>.
    //       </p>
    
    //       <a href="${taskLink}" style="display: inline-block; padding: 10px 16px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">View Task</a>
    
    //       <p style="font-size: 12px; color: #999999; margin-top: 30px;">
    //         You are receiving this email because you have been added to the project <strong>${project.title}</strong>.
    //       </p>
    //     </div>
    //   `;
    
    //   await sendEmail({
    //     to: userDoc.email,
    //     subject: `You've been assigned to a new task: ${task.title}`,
    //     html: emailBody,
    //   });
    // }
    

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// const updateTaskPriority = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { priority } = req.body;

//     const task = await Task.findById(taskId);

//     if (!task) {
//       return res.status(404).json({
//         message: "Task not found",
//       });
//     }

//     const project = await Project.findById(task.project);

//     if (!project) {
//       return res.status(404).json({
//         message: "Project not found",
//       });
//     }

//     const isMember = project.members.some(
//       (member) => member.user.toString() === req.user._id.toString()
//     );

//     if (!isMember) {
//       return res.status(403).json({
//         message: "You are not a member of this project",
//       });
//     }

//     const oldPriority = task.priority;

//     task.priority = priority;
//     await task.save();

//     // record activity
//     await recordActivity(req.user._id, "updated_task", "Task", taskId, {
//       description: `updated task priority from ${oldPriority} to ${priority}`,
//     });

//     res.status(200).json(task);
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };




const updateTaskPriority = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { priority } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: "Unauthorized" });

    const oldPriority = task.priority;

    task.priority = priority;
    await task.save();

    // 📝 Record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task priority from ${oldPriority} to ${priority}`,
    });

    // 📩 Notify all project members by email
    const userIds = project.members.map((m) => m.user);
    const users = await User.find({ _id: { $in: userIds } });

    const workspaceId = project.workspace.toString();
    const projectId = project._id.toString();
    const taskLink = `${process.env.FRONTEND_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${task._id}`;

    const subject = `Task Priority Updated: ${task.title}`;
    // const body = `
    //   <p>The priority of the task <strong>${task.title}</strong> has been updated from <strong>${oldPriority}</strong> to <strong>${priority}</strong>.</p>
    //   <p>Click <a href="${taskLink}">here</a> to view the task.</p>
    // `;

//     const body = `
//   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 8px; background-color: #ffffff;">
//     <h2 style="color: #333333;">🔔 Task Priority Updated</h2>

//     <p style="font-size: 14px; color: #555555;">
//       Hello ${user.name},
//     </p>

//     <p style="font-size: 14px; color: #555555;">
//       The priority of the task <strong>${task.title}</strong> in project <strong>${project.title}</strong> has been updated.
//     </p>

//     <p style="font-size: 14px; color: #555555;">
//       <strong>Previous Priority:</strong> ${oldPriority}<br />
//       <strong>New Priority:</strong> ${priority}
//     </p>

//     <p style="font-size: 14px; color: #555555;">
//       You can view the task by clicking the button below:
//     </p>

//     <a href="${taskLink}" style="display: inline-block; padding: 10px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">View Task</a>

//     <p style="font-size: 12px; color: #999999; margin-top: 30px;">
//       You are receiving this email because you are a member of the project <strong>${project.title}</strong>.
//     </p>
//   </div>
// `;


//     for (const user of users) {
//       if (user.email) {
//         await sendEmail(user.email, subject, body);
//       }
//     }

for (const member of project.members) {
  const userDoc = await User.findById(member.user);
  if (!userDoc || !userDoc.email) continue;

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #333333;">🔔 Task Priority Updated</h2>

      <p style="font-size: 14px; color: #555555;">
        Hello ${userDoc.name},
      </p>

      <p style="font-size: 14px; color: #555555;">
        The priority of the task <strong>${task.title}</strong> in project <strong>${project.title}</strong> has been updated.
      </p>

      <p style="font-size: 14px; color: #555555;">
        <strong>Previous Priority:</strong> ${oldPriority}<br />
        <strong>New Priority:</strong> ${priority}
      </p>

      <p style="font-size: 14px; color: #555555;">
        You can view the task by clicking the button below:
      </p>

      <a href="${taskLink}" style="display: inline-block; padding: 10px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">View Task</a>

      <p style="font-size: 12px; color: #999999; margin-top: 30px;">
        You are receiving this email because you are a member of the project <strong>${project.title}</strong>.
      </p>
    </div>
  `;

  await sendEmail(userDoc.email, subject, emailBody);
}


    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



const addSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const newSubTask = {
      title,
      completed: false,
    };

    task.subtasks.push(newSubTask);
    await task.save();

    // record activity
    await recordActivity(req.user._id, "created_subtask", "Task", taskId, {
      description: `created subtask ${title}`,
    });

    res.status(201).json(task);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateSubTask = async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { completed } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const subTask = task.subtasks.find(
      (subTask) => subTask._id.toString() === subTaskId
    );

    if (!subTask) {
      return res.status(404).json({
        message: "Subtask not found",
      });
    }

    subTask.completed = completed;
    await task.save();

    // record activity
    await recordActivity(req.user._id, "updated_subtask", "Task", taskId, {
      description: `updated subtask ${subTask.title}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};






const getActivityByResourceId = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const activity = await ActivityLog.find({ resourceId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(activity);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const newComment = await Comment.create({
      text,
      task: taskId,
      author: req.user._id,
    });

    task.comments.push(newComment._id);
    await task.save();

    // record activity
    await recordActivity(req.user._id, "added_comment", "Task", taskId, {
      description: `added comment ${
        text.substring(0, 50) + (text.length > 50 ? "..." : "")
      }`,
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const watchTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const isWatching = task.watchers.includes(req.user._id);

    if (!isWatching) {
      task.watchers.push(req.user._id);
    } else {
      task.watchers = task.watchers.filter(
        (watcher) => watcher.toString() !== req.user._id.toString()
      );
    }

    await task.save();

    // record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `${
        isWatching ? "stopped watching" : "started watching"
      } task ${task.title}`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const achievedTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }
    const isAchieved = task.isArchived;

    task.isArchived = !isAchieved;
    await task.save();

    // record activity
    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `${isAchieved ? "unachieved" : "achieved"} task ${
        task.title
      }`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignees: { $in: [req.user._id] } })
      .populate("project", "title workspace")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not authorized to delete this task" });
    }

    // Remove task reference from project
    project.tasks = project.tasks.filter(
      (id) => id.toString() !== task._id.toString()
    );
    await project.save();

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



// export {
//     createTask,
//     getTaskById,
//     updateTaskTitle,
//     updateTaskDescription,
//     updateTaskStatus,
//     updateTaskAssignees,
//     updateTaskPriority,
//     addSubTask,
//     updateSubTask,
// }


export {
  createTask,
  getTaskById,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskStatus,
  updateTaskAssignees,
  updateTaskPriority,
  addSubTask,
  updateSubTask,
  getActivityByResourceId,
  getCommentsByTaskId,
  addComment,
  watchTask,
  achievedTask,
  getMyTasks,
  deleteTask,
};