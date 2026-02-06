
// Seed Data to make the app look alive initially
const INITIAL_POSTS = [
    {
        id: 1,
        content: "Honestly, the coffee at the library vending machine tastes like battery acid today. Stay safe y'all. ☕💀 #CafeteriaFood",
        tag: "Complaint",
        timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
        votes: 42,
        comments: 5,
        color: "#ef4444" // Red for complaint
    },
    {
        id: 2,
        content: "To the guy playing piano in the student center right now... you're actually amazing. Please keep playing Interstellar. 🎹✨ #LibraryCrush",
        tag: "Crush",
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        votes: 128,
        comments: 12,
        color: "#ec4899" // Pink for crush
    },
    {
        id: 3,
        content: "Just submitted my final thesis. I don't know what to do with my hands anymore. Is this what freedom feels like? 🎓 #FinalsWeek",
        tag: "General",
        timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
        votes: 356,
        comments: 45,
        color: "#6366f1" // Indigo for general
    },
    {
        id: 4,
        content: "Does anyone know if the gym is open 24/7 during finals week? Need to stress-lift at 3AM. #FinalsWeek",
        tag: "Question",
        timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
        votes: 15,
        comments: 3,
        color: "#f59e0b" // Amber for question
    }
];

// State Management
let posts = JSON.parse(localStorage.getItem('campusEchoPosts')) || INITIAL_POSTS;

// DOM Elements
const postsContainer = document.getElementById('posts-container');
const postInput = document.getElementById('post-input');
const postTag = document.getElementById('post-tag');
const submitBtn = document.getElementById('submit-post');
const filterBtns = document.querySelectorAll('.filter-btn');
const navItems = document.querySelectorAll('.nav-item');
const trendingContainer = document.querySelector('.trending-tags');

// Current State
let currentFilter = 'All';
let activeTab = 'feed';

// Helper: Time Format (Relative)
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "Just now";
}

// Helper: Get Tag Color
function getTagColor(tag) {
    switch (tag) {
        case 'Complaint': return '#ef4444';
        case 'Crush': return '#ec4899';
        case 'Event': return '#10b981';
        case 'Question': return '#f59e0b';
        case 'Confession': return '#8b5cf6';
        default: return '#6366f1';
    }
}

// Render Posts
function renderPosts() {
    postsContainer.innerHTML = '';

    // Filter posts
    let filteredPosts = posts;
    if (currentFilter !== 'All') {
        filteredPosts = posts.filter(post => {
            // Hashtag search
            if (currentFilter.startsWith('#')) {
                return post.content.toLowerCase().includes(currentFilter.toLowerCase()); // Case insensitive search
            }
            // Map UI filter names to data tags
            if (currentFilter === 'Rants') return post.tag === 'Complaint';
            if (currentFilter === 'Confessions') return post.tag === 'Confession' || post.tag === 'Crush';
            if (currentFilter === 'Events') return post.tag === 'Event';
            return post.tag === currentFilter; // Fallback
        });
    }

    // Sort Logic based on Tab
    if (activeTab === 'hot') {
        filteredPosts = [...filteredPosts].sort((a, b) => b.votes - a.votes);
    } else {
        // Default: Newest first
        filteredPosts = [...filteredPosts].sort((a, b) => b.timestamp - a.timestamp);
    }

    // Update Header if filtering
    const feedHeader = document.querySelector('.feed-header h2');
    if (currentFilter.startsWith('#')) {
        feedHeader.textContent = `Posts in ${currentFilter}`;
    } else if (activeTab === 'hot') {
        feedHeader.textContent = 'Trending Posts';
    } else if (activeTab === 'campus') {
        feedHeader.textContent = 'My Campus';
    } else {
        feedHeader.textContent = "What's Happening?";
    }

    // Empty State
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                <i class="fa-solid fa-wind" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No posts found for <strong>${currentFilter}</strong></p>
                <p style="font-size: 0.9rem;">Be the first to post!</p>
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
        // Check if user already voted on this post
        const userVotes = JSON.parse(localStorage.getItem('campusEchoUserVotes')) || {};
        const voteStatus = userVotes[post.id] || 0; // 0, 1, or -1

        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            <div class="post-header">
                <span class="post-tag" style="color: ${getTagColor(post.tag)}; background: ${getTagColor(post.tag)}15">#${post.tag}</span>
                <span class="post-time">${timeAgo(post.timestamp)}</span>
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-footer">
                <div class="vote-controls">
                    <button class="vote-btn upvote ${voteStatus === 1 ? 'active' : ''}" onclick="vote(${post.id}, 1)">
                        <i class="fa-solid fa-chevron-up"></i>
                    </button>
                    <span class="vote-count" style="color: ${voteStatus !== 0 ? (voteStatus === 1 ? '#4ade80' : '#ef4444') : ''}">${post.votes}</span>
                    <button class="vote-btn downvote ${voteStatus === -1 ? 'active' : ''}" onclick="vote(${post.id}, -1)">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
                <button class="action-btn">
                    <i class="fa-regular fa-comment"></i>
                    ${post.comments}
                </button>
                <button class="action-btn">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
            </div>
        `;
        postsContainer.appendChild(card);
    });
}

// Add New Post
function addPost() {
    const content = postInput.value.trim();
    if (!content) return;

    const newPost = {
        id: Date.now(),
        content: content,
        tag: postTag.value,
        timestamp: Date.now(),
        votes: 0,
        comments: 0,
        color: getTagColor(postTag.value)
    };

    posts.unshift(newPost); // Add to beginning
    savePosts();

    // Update trending tags if content contains hashtags
    if (content.includes('#')) {
        updateTrendingTags();
    }

    // Reset filter to All to show new post
    currentFilter = 'All';
    updateFilterButtons();

    renderPosts();

    // Reset Input
    postInput.value = '';
    postInput.style.height = '100px'; // Reset height

    // Animation feedback
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
    submitBtn.style.background = '#10b981';
    setTimeout(() => {
        submitBtn.innerHTML = '<span>Post</span><i class="fa-solid fa-paper-plane"></i>';
        submitBtn.style.background = 'var(--accent-primary)';
    }, 2000);
}

// Voting Logic
window.vote = function (id, direction) {
    const userVotes = JSON.parse(localStorage.getItem('campusEchoUserVotes')) || {};
    const previousVote = userVotes[id] || 0;
    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) return;

    if (previousVote === direction) {
        // Toggle off (remove vote)
        posts[postIndex].votes -= direction;
        delete userVotes[id];
    } else {
        // Change vote (add direction, remove previous if exists)
        posts[postIndex].votes += direction - previousVote;
        userVotes[id] = direction;
    }

    localStorage.setItem('campusEchoUserVotes', JSON.stringify(userVotes));
    savePosts();
    renderPosts();
}

// Filter Logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.textContent;
        // removing active class from other buttons is handled in updateFilterButtons, but we need to handle "All" vs hashtags visuals
        updateFilterButtons();
        renderPosts();
    });
});

function updateFilterButtons() {
    filterBtns.forEach(btn => {
        if (btn.textContent === currentFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Sidebar Nav Logic
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        activeTab = item.dataset.tab;

        // Update header logic
        const feedHeader = document.querySelector('.feed-header h2');
        if (activeTab === 'hot') feedHeader.textContent = 'Trending Posts';
        else if (activeTab === 'campus') feedHeader.textContent = 'My Campus';
        else feedHeader.textContent = "What's Happening?";

        renderPosts();

        // Mobile close interaction based on visibility
        const sidebar = document.querySelector('.sidebar');
        if (window.getComputedStyle(sidebar).position === 'fixed') {
            sidebar.classList.remove('mobile-open');
        }
    });
});

// Trending Tags Logic
function updateTrendingTags() {
    const tagCounts = {};
    posts.forEach(post => {
        const matches = post.content.match(/#\w+/g);
        if (matches) {
            matches.forEach(tag => {
                // Normalize tag (e.g., lower case, or keep case?) - let's keep case but distinct loosely
                // For simplified logic, we just count exact strings.
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    // Convert to array and sort
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count desc
        .slice(0, 5); // Take top 5

    // Render
    trendingContainer.innerHTML = '';
    sortedTags.forEach(([tagName, count]) => {
        const div = document.createElement('div');
        div.className = 'tag-item';
        div.innerHTML = `
            <span class="tag-name">${tagName}</span>
            <span class="tag-count">${count} post${count !== 1 ? 's' : ''}</span>
        `;
        // Add click listener
        div.addEventListener('click', () => {
            currentFilter = tagName;
            filterBtns.forEach(btn => btn.classList.remove('active'));
            document.querySelector('.main-feed').scrollTop = 0;
            renderPosts();
        });
        trendingContainer.appendChild(div);
    });

    if (sortedTags.length === 0) {
        trendingContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">No hashtags trending yet.</p>';
    }
}


// Save to LocalStorage
function savePosts() {
    localStorage.setItem('campusEchoPosts', JSON.stringify(posts));
}

// Event Listeners
submitBtn.addEventListener('click', addPost);

// Auto-resize textarea
postInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Initial Render
renderPosts();
updateTrendingTags(); // Initialize trending tags

// Refresh times every minute
setInterval(renderPosts, 60000);

// Mobile Interaction
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.querySelector('.sidebar');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');

        // Add close button check
        if (!document.querySelector('.mobile-close-btn')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'mobile-close-btn';
            closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            closeBtn.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
            });
            sidebar.prepend(closeBtn);
        }
    });
}

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('mobile-open') &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
    }
});
