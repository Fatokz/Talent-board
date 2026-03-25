import { JarTemplate, GroupMember, Transaction, PendingApproval } from '../types'

// Emptied out for Firestore integration
export const currentUser = null

export const jarTemplates: JarTemplate[] = [
    {
        id: 1,
        name: 'Ajo (Thrift Savings)',
        emoji: '🔄',
        description: 'Monthly rotating savings club with democratic withdrawal controls',
        category: 'Traditional',
        goal: 0,
        raised: 0,
        members: 0,
        daysLeft: 0,
        governanceModel: 'Unanimous Consensus',
        color: 'from-blue-600 to-blue-500',
        goalReached: false,
        contributionAmount: 1000
    },
    {
        id: 2,
        name: 'Birthday / Gift Fund',
        emoji: '🎁',
        description: 'Surprise birthday fund for a friend or colleague',
        category: 'Celebration',
        goal: 0,
        raised: 0,
        members: 0,
        daysLeft: 0,
        governanceModel: 'Unanimous Consensus',
        color: 'from-emerald-500 to-emerald-400',
        goalReached: false
    },
    {
        id: 3,
        name: 'Burial Support',
        emoji: '🕊️',
        description: 'Community support fund for a family',
        category: 'Community',
        goal: 0,
        raised: 0,
        members: 0,
        daysLeft: 0,
        governanceModel: 'Majority Proxy',
        color: 'from-indigo-500 to-indigo-400',
        goalReached: false
    },
    {
        id: 4,
        name: 'School Fees',
        emoji: '🎓',
        description: 'Joint savings for children education',
        category: 'Education',
        goal: 0,
        raised: 0,
        members: 0,
        daysLeft: 0,
        governanceModel: 'Admin Managed',
        color: 'from-amber-500 to-amber-400',
        goalReached: false
    },
    {
        id: 5,
        name: 'Family Project',
        emoji: '🏡',
        description: 'Savings pool for extended family property development',
        category: 'Investment',
        goal: 0,
        raised: 0,
        members: 0,
        daysLeft: 0,
        governanceModel: 'Tiered Voting',
        color: 'from-rose-500 to-rose-400',
        goalReached: false
    }
]

export const groupMembers: GroupMember[] = []

export const transactions: Transaction[] = []

export const pendingApprovals: PendingApproval[] = []

export const mockVendors = [
    {
        id: 'v1',
        name: 'TechHub Laptops',
        category: 'Electronics',
        verified: true,
        bankName: 'GTBank',
        accountNumber: '0123456789',
        accountName: 'TechHub NG Ltd',
        rating: 4.8
    },
    {
        id: 'v2',
        name: 'University of Lagos (Unilag)',
        category: 'Education',
        verified: true,
        bankName: 'Access Bank',
        accountNumber: '0987654321',
        accountName: 'Unilag Tuition Acct',
        rating: 4.9
    },
    {
        id: 'v3',
        name: 'EventStars Planners',
        category: 'Events',
        verified: true,
        bankName: 'UBA',
        accountNumber: '2134567890',
        accountName: 'EventStars Ltd',
        rating: 4.5
    }
]

export const mockProducts = [
    {
        id: 'p1',
        vendorId: 'v1',
        name: 'MacBook Air M2',
        price: 950000,
        category: 'Electronics',
        description: '8GB RAM, 256GB SSD. Perfect for students and professionals.',
        image: 'https://images.unsplash.com/photo-1611186871348-b1ec696e5237?q=80&w=300&h=200&fit=crop'
    },
    {
        id: 'p2',
        vendorId: 'v1',
        name: 'Dell XPS 13',
        price: 850000,
        category: 'Electronics',
        description: 'High performance ultra-book for power users.',
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=300&h=200&fit=crop'
    },
    {
        id: 'p3',
        vendorId: 'v2',
        name: 'B.Sc. Computer Science (Year 1)',
        price: 250000,
        category: 'Education',
        description: 'Full tuition for 1st Year CS program.',
        image: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=300&h=200&fit=crop'
    },
    {
        id: 'p4',
        vendorId: 'v2',
        name: 'M.Sc. Data Science',
        price: 450000,
        category: 'Education',
        description: 'First semester tuition for graduate program.',
        image: 'https://images.unsplash.com/photo-1523050335392-9bc56754753f?q=80&w=300&h=200&fit=crop'
    },
    {
        id: 'p5',
        vendorId: 'v3',
        name: 'Classic Wedding Package',
        price: 2500000,
        category: 'Events',
        description: 'All-inclusive event planning for up to 100 guests.',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&h=200&fit=crop'
    },
    {
        id: 'p6',
        vendorId: 'v3',
        name: 'Corporate Gala Setup',
        price: 1500000,
        category: 'Events',
        description: 'Modern setup for corporate dinners and award nights.',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=300&h=200&fit=crop'
    }
]
