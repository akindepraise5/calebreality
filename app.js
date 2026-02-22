
// State Management
let posts = [];

// Helper: Extract Tag
function extractTag(text) {
    if (!text) return null;
    const match = text.match(/#(\w+)/);
    return match ? match[1] : null;
}

// Fetch Posts from API
async function fetchPosts() {
    try {
        const response = await fetch('https://anonbackends.onrender.com/posts');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        // Transform data to match app structure
        posts = data.map(post => {
            const tag = extractTag(post.content) || extractTag(post.title) || "General";

            // Process images
            let processedImages = [];
            if (post.post_images && Array.isArray(post.post_images)) {
                processedImages = post.post_images.map(img => `https://devwole.space/${img.object_key}`);
            } else if (post.images) {
                processedImages = post.images;
            }

            // Process comments count
            let commentCount = 0;
            if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
                commentCount = post.comments[0].count;
            } else if (typeof post.comment_count === 'number') {
                commentCount = post.comment_count;
            }

            return {
                id: post.id,
                content: post.content,
                title: post.title,
                tag: tag,
                timestamp: new Date(post.created_at).getTime(),
                votes: 0,
                comments: commentCount,

                color: getTagColor(tag),
                images: processedImages
            };
        });

        // Restore local votes overlay
        const userVotes = JSON.parse(localStorage.getItem('campusEchoUserVotes')) || {};
        posts.forEach(p => {
            if (userVotes[p.id]) {
                p.votes += userVotes[p.id];
            }
        });

        renderPosts();
        updateTrendingTags();
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// DOM Elements
const postsContainer = document.getElementById('posts-container');
const postInput = document.getElementById('post-input');
const postTag = document.getElementById('post-tag');
const submitBtn = document.getElementById('submit-post');
const imageInput = document.getElementById('image-input');
const addImageBtn = document.getElementById('add-image-btn');
const imagePreview = document.getElementById('image-preview-container');
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
            ${post.title ? `<h3 style="margin-bottom: 8px; font-size: 1.1rem; color: #fff;">${post.title}</h3>` : ''}
            <div class="post-content">
                ${post.content}
            </div>
            ${post.images && post.images.length > 0 ? `
            <div class="post-images" style="display: flex; gap: 8px; overflow-x: auto; margin-bottom: 16px; padding-bottom: 4px;">
                ${post.images.map(img => `
                    <div class="image-wrapper skeleton-loader" style="height: 200px; min-width: 150px; flex-shrink: 0; border-radius: 8px; overflow: hidden; position: relative;">
                        <img src="${img}" 
                             style="width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.5s ease;" 
                             onload="this.style.opacity='1'; this.parentElement.classList.remove('skeleton-loader');"
                             onerror="this.parentElement.style.display='none';"
                             onclick="window.open(this.src, '_blank')">
                    </div>`).join('')}
            </div>
            ` : ''}
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
                <button class="action-btn" onclick="toggleCommentBox(${post.id})">
                    <i class="fa-regular fa-comment"></i>
                    ${post.comments}
                </button>
                <button class="action-btn">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
            </div>
            <!-- Comment Section (Hidden by default) -->
            <div id="comment-box-${post.id}" class="comment-box" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--glass-border);">
                <div id="comments-list-${post.id}" style="margin-bottom: 12px; max-height: 200px; overflow-y: auto;">
                    <!-- Comments loaded here -->
                </div>
                <div class="comment-input-wrapper" style="display: flex; gap: 8px;">
                    <input type="text" id="comment-input-${post.id}" class="compose-input" style="height: 40px; margin-bottom: 0;" placeholder="Write a reply..." />
                    <button class="post-btn" onclick="submitComment(${post.id})" style="padding: 0 16px; border-radius: 12px;">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        postsContainer.appendChild(card);
    });
}

// Toggle Comment Box
window.toggleCommentBox = function (postId) {
    const box = document.getElementById(`comment-box-${postId}`);
    if (box.style.display === 'none') {
        box.style.display = 'block';
        fetchComments(postId); // Load comments when opening
        document.getElementById(`comment-input-${postId}`).focus();
    } else {
        box.style.display = 'none';
        // Optional: clear content or keep it loaded? User asked to "let comments load dynamically without reloading the page"
        // Keeping it simple: hide it. Next open will re-fetch to get latest.
    }
}

// Fetch Comments
window.fetchComments = async function (postId) {
    const listContainer = document.getElementById(`comments-list-${postId}`);
    listContainer.innerHTML = '<div style="text-align:center; padding: 10px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Loading comments...</div>';

    try {
        const response = await fetch(`https://anonbackends.onrender.com/comments/post/${postId}`);
        if (!response.ok) throw new Error('Failed to load comments');
        const comments = await response.json();

        listContainer.innerHTML = '';

        if (comments.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center; padding: 10px; color: var(--text-secondary); font-size: 0.85rem;">No comments yet. Be the first!</div>';
            return;
        }

        comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.style.cssText = 'padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;';
            commentEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 600; color: var(--text-secondary); font-size: 0.8rem;">Anonymous</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${timeAgo(new Date(comment.created_at || Date.now()))}</span>
                </div>
                <div style="color: #e0e7ff;">${comment.content}</div>
            `;
            listContainer.appendChild(commentEl);
        });

        // Update local comment count in UI if needed (though user said use comment_count only on first load?)
        // "after only on first load use the comments count itslef" implies we SHOULD update it dynamically thereafter?
        // Actually: "dont use comment_count after only on first load" likely means "don't rely on the post object's comment_count for updates, count the actual comments"
        // Let's update the UI counter based on length
        const commentCountBtn = document.querySelector(`button[onclick="toggleCommentBox(${postId})"]`);
        if (commentCountBtn) {
            commentCountBtn.innerHTML = `
                <i class="fa-regular fa-comment"></i>
                ${comments.length}
            `;
        }

    } catch (err) {
        console.error(err);
        listContainer.innerHTML = '<div style="text-align:center; padding: 10px; color: #ef4444; font-size: 0.85rem;">Failed to load comments.</div>';
    }
}

// Submit Comment
window.submitComment = async function (postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();

    if (!content) return;

    // Visual feedback
    const btn = input.nextElementSibling;
    const originalBtnContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await fetch('https://anonbackends.onrender.com/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: content,
                post_id: postId
            })
        });

        if (response.ok) {
            // Success feedback
            input.value = '';
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = '#10b981';

            setTimeout(() => {
                btn.innerHTML = originalBtnContent;
                btn.style.background = 'var(--accent-primary)';
                // Don't close box, just refresh comments list
                fetchComments(postId);
            }, 1000);
        } else {
            throw new Error('Failed to post comment');
        }
    } catch (err) {
        console.error(err);
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        setTimeout(() => {
            btn.innerHTML = originalBtnContent;
        }, 2000);
    }
}


// Add New Post
async function addPost() {
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-input');

    // postTag fallback or mapping could be used, but for now relying on title/content hashtags

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const files = imageInput.files;

    // Auto-generate random password
    const password = Math.random().toString(36).slice(-8);

    if (!content && files.length === 0) return;

    // Show loading state
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    // Upload images first if any
    let imageKeys = [];
    if (files.length > 0) {
        try {
            const uploadRes = await fetch(`https://anonbackends.onrender.com/posts/upload/${files.length}`);
            if (!uploadRes.ok) throw new Error('Failed to get upload URLs');
            const uploadUrls = await uploadRes.json();
            const entries = Object.entries(uploadUrls);

            // Upload files in parallel
            const uploadPromises = Array.from(files).map((file, index) => {
                const [key, url] = entries[index];
                return fetch(url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type
                    }
                }).then(res => {
                    if (res.ok) return key;
                    throw new Error('Upload failed');
                });
            });

            imageKeys = await Promise.all(uploadPromises);

        } catch (err) {
            console.error('Image upload failed:', err);
            submitBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Upload Error';
            setTimeout(() => {
                submitBtn.innerHTML = '<span>Post</span><i class="fa-solid fa-paper-plane"></i>';
                submitBtn.style.background = 'var(--accent-primary)';
            }, 2000);
            return; // Stop if image upload fails
        }
    }

    const payload = {
        title: title || "Anonymous Post",
        content: content,
        deletion_password: password,
        images: imageKeys
    };

    try {
        const response = await fetch('https://anonbackends.onrender.com/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Reset Inputs
            titleInput.value = '';
            contentInput.value = '';
            contentInput.style.height = '100px';
            imageInput.value = ''; // Clear file input
            imagePreview.innerHTML = ''; // Clear previews

            // Animation feedback
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
            submitBtn.style.background = '#10b981';

            // Refresh posts
            fetchPosts();

            setTimeout(() => {
                submitBtn.innerHTML = '<span>Post</span><i class="fa-solid fa-paper-plane"></i>';
                submitBtn.style.background = 'var(--accent-primary)';
            }, 2000);

            // Reset filter to All to see new post
            currentFilter = 'All';
            updateFilterButtons();
        } else {
            throw new Error('Post failed');
        }
    } catch (err) {
        console.error(err);
        submitBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error';
        setTimeout(() => {
            submitBtn.innerHTML = '<span>Post</span><i class="fa-solid fa-paper-plane"></i>';
        }, 2000);
    }
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
// Save to LocalStorage (Only for votes now)
function savePosts() {
    // No-op for posts, strictly vote saving is handled in vote() via campusEchoUserVotes
}

// Image Upload Events
addImageBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', () => {
    imagePreview.innerHTML = '';
    const files = Array.from(imageInput.files);

    if (files.length > 0) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.style.cssText = 'position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; border: 1px solid var(--glass-border);';
                div.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                imagePreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
        addImageBtn.style.color = 'var(--accent-primary)';
    } else {
        addImageBtn.style.color = 'var(--text-secondary)';
    }
});

// Event Listeners
submitBtn.addEventListener('click', addPost);

// Auto-resize textarea
postInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Initial Render
fetchPosts();
// updateTrendingTags is called inside fetchPosts

// Refresh times every minute
setInterval(fetchPosts, 60000);

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
