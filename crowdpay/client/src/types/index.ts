export interface JarTemplate {
    id: number | string
    name: string
    emoji: string
    category: string
    goal: number
    raised: number
    members: number
    daysLeft: number
    governanceModel: string
    description: string
    color: string
    goalReached: boolean
    goalReachedFor?: string
    creatorId?: string
}

export interface GroupMember {
    id: number
    name: string
    initials: string
    role: string
    status: 'approved' | 'pending' | 'declined'
    voted: boolean
    reason?: string
}

export interface Transaction {
    id: number
    type: 'deposit' | 'withdrawal'
    member: string
    jar: string
    amount: number
    date: string
    status: 'completed' | 'pending_votes' | 'approved'
}

export interface PendingApproval {
    id: number
    requestedBy: string
    initials: string
    jar: string
    amount: number
    reason: string
    invoiceLabel: string
    requestedAt: string
    votesFor: number
    votesAgainst: number
    totalVoters: number
    votingDeadline: string
    status: string
}

export interface VotingModalState {
    isOpen: boolean
    jar?: JarTemplate
    approval?: PendingApproval
}
