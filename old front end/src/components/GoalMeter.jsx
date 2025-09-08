import { useState, useEffect } from 'react'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'

function GoalMeter({ userId }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [newGoal, setNewGoal] = useState({
    targetAmount: '',
    description: '',
  })
  const { success, error: showError } = useAlert()

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const response = await apiService.getMyGoals()
      setGoals(response.goals || [])
      
      // Check for newly completed goals that need celebration
      const completedGoals = response.goals?.filter(goal => 
        goal.completed && 
        !localStorage.getItem(`goal_${goal._id}_celebrated`)
      ) || []
      
      // Celebrate completed goals
      if (completedGoals.length > 0) {
        completedGoals.forEach(goal => {
          celebrateGoalCompletion(goal)
          // Mark as celebrated so we don't show it again
          localStorage.setItem(`goal_${goal._id}_celebrated`, 'true')
        })
      }
    } catch (err) {
      console.error('Error loading goals:', err)
      showError('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()
    
    try {
      if (!newGoal.targetAmount || !newGoal.description) {
        showError('Please fill in all fields')
        return
      }

      const payload = {
        targetAmount: parseFloat(newGoal.targetAmount),
        description: newGoal.description
      }
      
      const response = await apiService.createGoal(payload)
      
      if (response.goal) {
        setGoals([...goals, response.goal])
        setNewGoal({ targetAmount: '', description: '' })
        setShowAddModal(false)
        success('Goal created successfully!')
      }
    } catch (err) {
      console.error('Error creating goal:', err)
      showError('Failed to create goal')
    }
  }

  const handleUpdateGoal = async (id, updates) => {
    try {
      // Ensure all properties are valid before sending
      const validUpdates = {
        description: updates.description || '',
        targetAmount: Number(updates.targetAmount) || 0,
        progress: Number(updates.progress) || 0
      }
      
      // Calculate completed status based on valid numbers
      validUpdates.completed = validUpdates.progress >= validUpdates.targetAmount
      
      console.log('Sending goal update:', id, validUpdates)
      
      const response = await apiService.updateGoal(id, validUpdates)
      
      if (response.goal) {
        // Update goals list
        setGoals(goals.map(goal => 
          goal._id === id ? response.goal : goal
        ))
        
        // Check if goal was completed
        if (response.goal.completed) {
          celebrateGoalCompletion(response.goal)
        }
        
        success('Goal updated successfully!')
      }
    } catch (err) {
      console.error('Error updating goal:', err)
      showError('Failed to update goal')
    }
  }

  const handleDeleteGoal = async (id) => {
    try {
      if (!window.confirm('Are you sure you want to delete this goal?')) {
        return
      }
      
      const response = await apiService.deleteGoal(id)
      
      if (response.deletedGoal) {
        setGoals(goals.filter(goal => goal._id !== id))
        success('Goal deleted successfully!')
      }
    } catch (err) {
      console.error('Error deleting goal:', err)
      showError('Failed to delete goal')
    }
  }

  const calculateProgress = (goal) => {
    return Math.min(100, Math.round((goal.progress / goal.targetAmount) * 100))
  }

  // Function to celebrate goal completion with animation
  const celebrateGoalCompletion = (goal) => {
    success(`🎉 Congratulations! You've reached your goal: ${goal.description}`)
    
    // Create confetti animation
    createConfetti()
  }

  // Create confetti animation
  const createConfetti = () => {
    const confettiContainer = document.createElement('div')
    confettiContainer.className = 'confetti-container'
    document.body.appendChild(confettiContainer)
    
    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti'
      confetti.style.left = `${Math.random() * 100}%`
      confetti.style.animationDelay = `${Math.random() * 3}s`
      confetti.style.backgroundColor = getRandomColor()
      confettiContainer.appendChild(confetti)
    }
    
    // Remove after animation completes
    setTimeout(() => {
      document.body.removeChild(confettiContainer)
    }, 5000)
  }

  // Helper function for random confetti colors
  const getRandomColor = () => {
    const colors = [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
      '#FF00FF', '#00FFFF', '#FFA500', '#800080'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const handleOpenEditModal = (goal) => {
    // Ensure we're setting valid numbers and defaults
    setEditingGoal({
      _id: goal._id,
      description: goal.description || '',
      targetAmount: Number(goal.targetAmount) || 0,
      progress: Number(goal.progress) || 0,
      completed: Boolean(goal.completed)
    })
    setShowEditModal(true)
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditingGoal(prev => ({
      ...prev,
      [name]: name === 'targetAmount' || name === 'progress' 
        ? (value === '' ? '' : Number(value))
        : value
    }))
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    
    try {
      if (!editingGoal.description || editingGoal.targetAmount === '') {
        showError('Please fill in all required fields')
        return
      }
      
      // Convert to numbers ensuring they are valid
      const targetAmount = Number(editingGoal.targetAmount)
      const progress = Number(editingGoal.progress || 0)
      
      if (isNaN(targetAmount) || isNaN(progress)) {
        showError('Please enter valid numbers for amount and progress')
        return
      }
      
      const updates = {
        description: editingGoal.description,
        targetAmount: targetAmount,
        progress: progress,
        completed: progress >= targetAmount
      }
      
      await handleUpdateGoal(editingGoal._id, updates)
      setShowEditModal(false)
    } catch (err) {
      console.error('Error updating goal:', err)
      showError('Failed to update goal')
    }
  }

  if (loading) {
    return (
      <div className="goals-loading">
        <div className="spinner"></div>
        <p>Loading goals...</p>
      </div>
    )
  }

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h2>My Financial Goals</h2>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="add-goal-btn"
        >
          ✨ New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="no-goals">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>You haven't set any financial goals yet.</p>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="start-goal-btn"
            >
              Set your first goal
            </button>
          </div>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map(goal => (
            <div 
              key={goal._id} 
              className={`goal-card ${goal.completed ? 'completed' : ''}`}
            >
              <div className="goal-header">
                <h3>{goal.description}</h3>
                <div className="goal-actions">
                  <button 
                    onClick={() => handleOpenEditModal(goal)} 
                    className="edit-goal-btn"
                    title="Edit Goal"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(goal._id)} 
                    className="delete-goal-btn"
                    title="Delete Goal"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="goal-amount">
                <div className="target">
                  <span className="label">Target:</span>
                  <span className="value">₱{goal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="progress-value">
                  <span className="label">Progress:</span>
                  <span className="value">₱{goal.progress.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="goal-progress-container">
                <div 
                  className="goal-progress-bar" 
                  style={{ width: `${calculateProgress(goal)}%` }}
                ></div>
                <span className="goal-percentage">{calculateProgress(goal)}%</span>
              </div>
              
              <div className="goal-footer">
                {!goal.completed ? (
                  <button 
                    onClick={() => handleUpdateGoal(goal._id, { 
                      completed: true 
                    })} 
                    className="complete-goal-btn"
                    disabled={goal.progress < goal.targetAmount}
                    title={goal.progress < goal.targetAmount ? 
                      "You haven't reached your target yet" : 
                      "Mark as complete"}
                  >
                    {goal.progress >= goal.targetAmount ? 'Complete Goal' : 'Not Yet Reached'}
                  </button>
                ) : (
                  <div className="goal-completed-badge">
                    ✅ Goal Completed!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Goal</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="close-modal-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label htmlFor="description">Goal Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="e.g., New Laptop, Emergency Fund"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="targetAmount">Target Amount (₱)</label>
                <input
                  type="number"
                  id="targetAmount"
                  name="targetAmount"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  placeholder="e.g., 10000"
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditModal && editingGoal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Goal</h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="close-modal-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label htmlFor="edit-description">Goal Description</label>
                <input
                  type="text"
                  id="edit-description"
                  name="description"
                  value={editingGoal.description}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-targetAmount">Target Amount (₱)</label>
                <input
                  type="number"
                  id="edit-targetAmount"
                  name="targetAmount"
                  value={editingGoal.targetAmount}
                  onChange={handleEditInputChange}
                  min="1"
                  step="any"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-progress">Current Progress (₱)</label>
                <input
                  type="number"
                  id="edit-progress"
                  name="progress"
                  value={editingGoal.progress || 0}
                  onChange={handleEditInputChange}
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                >
                  Update Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .goals-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin: 2rem 0;
          overflow: hidden;
        }
        
        .goals-header {
          background: linear-gradient(135deg, #3182ce, #2b6cb0);
          color: white;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .goals-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .add-goal-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.4);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .add-goal-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }
        
        .no-goals {
          padding: 3rem 1rem;
          text-align: center;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        
        .start-goal-btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          margin-top: 1rem;
        }
        
        .start-goal-btn:hover {
          background: #2b6cb0;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .goals-list {
          padding: 1.5rem;
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }
        
        .goal-card {
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        
        .goal-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        
        .goal-card.completed {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
        
        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .goal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #2d3748;
          flex: 1;
        }
        
        .goal-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .edit-goal-btn,
        .delete-goal-btn {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .edit-goal-btn:hover {
          color: #3182ce;
          background: rgba(49, 130, 206, 0.1);
        }
        
        .delete-goal-btn:hover {
          color: #e53e3e;
          background: rgba(229, 62, 62, 0.1);
        }
        
        .goal-amount {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .goal-amount .label {
          color: #718096;
          font-size: 0.875rem;
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .goal-amount .value {
          font-weight: 600;
          color: #2d3748;
          font-size: 1.125rem;
        }
        
        .goal-progress-container {
          height: 12px;
          background: #e2e8f0;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .goal-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3182ce, #63b3ed);
          border-radius: 6px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .goal-percentage {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          font-size: 0.75rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        .goal-footer {
          display: flex;
          justify-content: center;
        }
        
        .complete-goal-btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          width: 100%;
        }
        
        .complete-goal-btn:hover:not(:disabled) {
          background: #2b6cb0;
        }
        
        .complete-goal-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }
        
        .goal-completed-badge {
          background: #10b981;
          color: white;
          text-align: center;
          padding: 0.5rem;
          border-radius: 6px;
          font-weight: 600;
          width: 100%;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #2d3748;
        }
        
        .close-modal-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #a0aec0;
          cursor: pointer;
        }
        
        .close-modal-btn:hover {
          color: #2d3748;
        }
        
        .modal-content form {
          padding: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #4a5568;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .cancel-btn {
          padding: 0.75rem 1.25rem;
          background: #e2e8f0;
          color: #4a5568;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        
        .save-btn {
          padding: 0.75rem 1.25rem;
          background: #3182ce;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        
        .save-btn:hover {
          background: #2b6cb0;
        }
        
        /* Loading State */
        .goals-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(49, 130, 206, 0.1);
          border-left-color: #3182ce;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        
        /* Confetti Animation */
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9999;
          pointer-events: none;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 10px;
          background-color: #FFC107;
          opacity: 0.7;
          animation: confetti-fall 5s ease-in-out forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        /* Responsive Styles */
        @media (max-width: 768px) {
          .goals-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default GoalMeter
