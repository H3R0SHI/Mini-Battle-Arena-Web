/**
 * Physics System
 * Handles collision detection, physics simulation, and spatial queries
 */

class PhysicsEngine {
    constructor() {
        this.gravity = 980; // pixels per second squared
        this.bodies = new Map();
        this.collisionPairs = [];
        
        console.log('⚡ Physics Engine initialized');
    }
    
    /**
     * Create a physics body
     * @param {string} id - Unique identifier
     * @param {Object} config - Body configuration
     */
    createBody(id, config) {
        const body = {
            id,
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || 32,
            height: config.height || 32,
            vx: config.vx || 0,
            vy: config.vy || 0,
            mass: config.mass || 1,
            restitution: config.restitution || 0.3, // bounciness
            friction: config.friction || 0.8,
            isStatic: config.isStatic || false,
            isTrigger: config.isTrigger || false,
            layer: config.layer || 'default',
            
            // Shape type
            shape: config.shape || 'rectangle', // rectangle, circle
            radius: config.radius || Math.min(config.width || 32, config.height || 32) / 2,
            
            // Collision callbacks
            onCollisionEnter: config.onCollisionEnter || null,
            onCollisionExit: config.onCollisionExit || null,
            onTriggerEnter: config.onTriggerEnter || null,
            onTriggerExit: config.onTriggerExit || null,
            
            // Internal state
            grounded: false,
            collidingWith: new Set(),
            lastPosition: { x: config.x || 0, y: config.y || 0 }
        };
        
        this.bodies.set(id, body);
        return body;
    }
    
    /**
     * Remove a physics body
     * @param {string} id - Body identifier
     */
    removeBody(id) {
        this.bodies.delete(id);
    }
    
    /**
     * Get a physics body
     * @param {string} id - Body identifier
     * @returns {Object|null} Physics body or null
     */
    getBody(id) {
        return this.bodies.get(id) || null;
    }
    
    /**
     * Update physics simulation
     * @param {number} deltaTime - Time step
     */
    update(deltaTime) {
        // Update all bodies
        for (const [id, body] of this.bodies) {
            this.updateBody(body, deltaTime);
        }
        
        // Check collisions
        this.checkCollisions();
    }
    
    /**
     * Update a single physics body
     * @param {Object} body - Physics body
     * @param {number} deltaTime - Time step
     */
    updateBody(body, deltaTime) {
        if (body.isStatic) return;
        
        // Store last position
        body.lastPosition.x = body.x;
        body.lastPosition.y = body.y;
        
        // Apply gravity
        if (!body.grounded && body.mass > 0) {
            body.vy += this.gravity * deltaTime;
        }
        
        // Apply friction
        body.vx *= Math.pow(body.friction, deltaTime);
        
        // Update position
        body.x += body.vx * deltaTime;
        body.y += body.vy * deltaTime;
        
        // Constrain to arena bounds
        this.constrainToArena(body);
        
        // Reset grounded state
        body.grounded = false;
    }
    
    /**
     * Constrain body to arena boundaries
     * @param {Object} body - Physics body
     */
    constrainToArena(body) {
        const margin = 10; // Small margin from edges
        
        // Left boundary
        if (body.x < margin) {
            body.x = margin;
            body.vx = Math.abs(body.vx) * body.restitution;
        }
        
        // Right boundary
        if (body.x + body.width > gameConfig.arenaWidth - margin) {
            body.x = gameConfig.arenaWidth - margin - body.width;
            body.vx = -Math.abs(body.vx) * body.restitution;
        }
        
        // Top boundary
        if (body.y < margin) {
            body.y = margin;
            body.vy = Math.abs(body.vy) * body.restitution;
        }
        
        // Bottom boundary (ground)
        if (body.y + body.height > gameConfig.arenaHeight - margin) {
            body.y = gameConfig.arenaHeight - margin - body.height;
            body.vy = 0;
            body.grounded = true;
        }
    }
    
    /**
     * Check collisions between all bodies
     */
    checkCollisions() {
        const bodyArray = Array.from(this.bodies.values());
        
        for (let i = 0; i < bodyArray.length; i++) {
            for (let j = i + 1; j < bodyArray.length; j++) {
                const bodyA = bodyArray[i];
                const bodyB = bodyArray[j];
                
                if (this.checkCollision(bodyA, bodyB)) {
                    this.resolveCollision(bodyA, bodyB);
                }
            }
        }
    }
    
    /**
     * Check if two bodies are colliding
     * @param {Object} bodyA - First body
     * @param {Object} bodyB - Second body
     * @returns {boolean} True if colliding
     */
    checkCollision(bodyA, bodyB) {
        if (bodyA.shape === 'rectangle' && bodyB.shape === 'rectangle') {
            return this.checkRectangleCollision(bodyA, bodyB);
        } else if (bodyA.shape === 'circle' && bodyB.shape === 'circle') {
            return this.checkCircleCollision(bodyA, bodyB);
        } else {
            // Mixed shapes - use circle-rectangle collision
            const circle = bodyA.shape === 'circle' ? bodyA : bodyB;
            const rect = bodyA.shape === 'rectangle' ? bodyA : bodyB;
            return this.checkCircleRectangleCollision(circle, rect);
        }
    }
    
    /**
     * Check rectangle-rectangle collision
     * @param {Object} rectA - First rectangle
     * @param {Object} rectB - Second rectangle
     * @returns {boolean} True if colliding
     */
    checkRectangleCollision(rectA, rectB) {
        return rectA.x < rectB.x + rectB.width &&
               rectA.x + rectA.width > rectB.x &&
               rectA.y < rectB.y + rectB.height &&
               rectA.y + rectA.height > rectB.y;
    }
    
    /**
     * Check circle-circle collision
     * @param {Object} circleA - First circle
     * @param {Object} circleB - Second circle
     * @returns {boolean} True if colliding
     */
    checkCircleCollision(circleA, circleB) {
        const dx = (circleA.x + circleA.radius) - (circleB.x + circleB.radius);
        const dy = (circleA.y + circleA.radius) - (circleB.y + circleB.radius);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < circleA.radius + circleB.radius;
    }
    
    /**
     * Check circle-rectangle collision
     * @param {Object} circle - Circle body
     * @param {Object} rect - Rectangle body
     * @returns {boolean} True if colliding
     */
    checkCircleRectangleCollision(circle, rect) {
        const circleX = circle.x + circle.radius;
        const circleY = circle.y + circle.radius;
        
        // Find closest point on rectangle to circle center
        const closestX = Math.max(rect.x, Math.min(circleX, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circleY, rect.y + rect.height));
        
        // Calculate distance
        const dx = circleX - closestX;
        const dy = circleY - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < circle.radius;
    }
    
    /**
     * Resolve collision between two bodies
     * @param {Object} bodyA - First body
     * @param {Object} bodyB - Second body
     */
    resolveCollision(bodyA, bodyB) {
        // Handle trigger collisions
        if (bodyA.isTrigger || bodyB.isTrigger) {
            this.handleTriggerCollision(bodyA, bodyB);
            return;
        }
        
        // Skip if both bodies are static
        if (bodyA.isStatic && bodyB.isStatic) return;
        
        // Handle collision enter events
        if (!bodyA.collidingWith.has(bodyB.id)) {
            bodyA.collidingWith.add(bodyB.id);
            bodyB.collidingWith.add(bodyA.id);
            
            if (bodyA.onCollisionEnter) bodyA.onCollisionEnter(bodyB);
            if (bodyB.onCollisionEnter) bodyB.onCollisionEnter(bodyA);
        }
        
        // Calculate collision normal and overlap
        const collision = this.calculateCollisionData(bodyA, bodyB);
        
        if (collision.overlap > 0) {
            // Separate bodies
            this.separateBodies(bodyA, bodyB, collision);
            
            // Apply collision response
            this.applyCollisionResponse(bodyA, bodyB, collision);
        }
    }
    
    /**
     * Handle trigger collision
     * @param {Object} bodyA - First body
     * @param {Object} bodyB - Second body
     */
    handleTriggerCollision(bodyA, bodyB) {
        const trigger = bodyA.isTrigger ? bodyA : bodyB;
        const other = bodyA.isTrigger ? bodyB : bodyA;
        
        if (!trigger.collidingWith.has(other.id)) {
            trigger.collidingWith.add(other.id);
            if (trigger.onTriggerEnter) trigger.onTriggerEnter(other);
        }
    }
    
    /**
     * Calculate collision data
     * @param {Object} bodyA - First body
     * @param {Object} bodyB - Second body
     * @returns {Object} Collision data
     */
    calculateCollisionData(bodyA, bodyB) {
        // Simple AABB collision resolution
        const centerAX = bodyA.x + bodyA.width / 2;
        const centerAY = bodyA.y + bodyA.height / 2;
        const centerBX = bodyB.x + bodyB.width / 2;
        const centerBY = bodyB.y + bodyB.height / 2;
        
        const dx = centerBX - centerAX;
        const dy = centerBY - centerAY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate overlap
        const overlapX = (bodyA.width + bodyB.width) / 2 - Math.abs(dx);
        const overlapY = (bodyA.height + bodyB.height) / 2 - Math.abs(dy);
        
        let overlap, normalX, normalY;
        
        if (overlapX < overlapY) {
            overlap = overlapX;
            normalX = dx < 0 ? -1 : 1;
            normalY = 0;
        } else {
            overlap = overlapY;
            normalX = 0;
            normalY = dy < 0 ? -1 : 1;
        }
        
        return { overlap, normalX, normalY, distance };
    }
    
    /**
     * Separate overlapping bodies
     * @param {Object} bodyA - First body
     * @param {Object} bodyB - Second body
     * @param {Object} collision - Collision data
     */
    separateBodies(bodyA, bodyB, collision) {
        const totalMass = bodyA.mass + bodyB.mass;
        const separationA = bodyB.isStatic ? collision.overlap : (bodyB.mass / totalMass) * collision.overlap;
        const separationB = bodyA.isStatic ? collision.overlap : (bodyA.mass / totalMass) * collision.overlap;
        
        if (!bodyA.isStatic) {
            bodyA.x -= separationA * collision.normalX;
            bodyA.y -= separationA * collision.normalY;
        }
        
        if (!bodyB.isStatic) {
            bodyB.x += separationB * collision.normalX;
            bodyB.y += separationB * collision.normalY;
        }
    }
    
    /**
     * Apply collision response (velocity changes)
     * @param {Object} bodyA - First body
     * @param {Object} bodyB - Second body
     * @param {Object} collision - Collision data
     */
    applyCollisionResponse(bodyA, bodyB, collision) {
        // Calculate relative velocity
        const relativeVelX = bodyB.vx - bodyA.vx;
        const relativeVelY = bodyB.vy - bodyA.vy;
        
        // Calculate relative velocity along collision normal
        const velAlongNormal = relativeVelX * collision.normalX + relativeVelY * collision.normalY;
        
        // Don't resolve if velocities are separating
        if (velAlongNormal > 0) return;
        
        // Calculate restitution
        const restitution = Math.min(bodyA.restitution, bodyB.restitution);
        
        // Calculate impulse scalar
        const impulse = -(1 + restitution) * velAlongNormal;
        const totalMass = bodyA.mass + bodyB.mass;
        const impulseScalar = impulse / totalMass;
        
        // Apply impulse
        if (!bodyA.isStatic) {
            bodyA.vx -= impulseScalar * bodyB.mass * collision.normalX;
            bodyA.vy -= impulseScalar * bodyB.mass * collision.normalY;
            
            // Check if landed on ground
            if (collision.normalY < -0.5) {
                bodyA.grounded = true;
            }
        }
        
        if (!bodyB.isStatic) {
            bodyB.vx += impulseScalar * bodyA.mass * collision.normalX;
            bodyB.vy += impulseScalar * bodyA.mass * collision.normalY;
            
            // Check if landed on ground
            if (collision.normalY > 0.5) {
                bodyB.grounded = true;
            }
        }
    }
    
    /**
     * Apply force to a body
     * @param {string} id - Body identifier
     * @param {number} forceX - Force in X direction
     * @param {number} forceY - Force in Y direction
     */
    applyForce(id, forceX, forceY) {
        const body = this.getBody(id);
        if (!body || body.isStatic) return;
        
        body.vx += forceX / body.mass;
        body.vy += forceY / body.mass;
    }
    
    /**
     * Apply impulse to a body
     * @param {string} id - Body identifier
     * @param {number} impulseX - Impulse in X direction
     * @param {number} impulseY - Impulse in Y direction
     */
    applyImpulse(id, impulseX, impulseY) {
        const body = this.getBody(id);
        if (!body || body.isStatic) return;
        
        body.vx += impulseX;
        body.vy += impulseY;
    }
    
    /**
     * Set body velocity
     * @param {string} id - Body identifier
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     */
    setVelocity(id, vx, vy) {
        const body = this.getBody(id);
        if (!body || body.isStatic) return;
        
        body.vx = vx;
        body.vy = vy;
    }
    
    /**
     * Get bodies within a radius
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Search radius
     * @param {string} layer - Layer filter (optional)
     * @returns {Array} Array of bodies within radius
     */
    getBodiesInRadius(x, y, radius, layer = null) {
        const result = [];
        
        for (const [id, body] of this.bodies) {
            if (layer && body.layer !== layer) continue;
            
            const bodyX = body.x + body.width / 2;
            const bodyY = body.y + body.height / 2;
            const distance = Math.sqrt((bodyX - x) ** 2 + (bodyY - y) ** 2);
            
            if (distance <= radius) {
                result.push(body);
            }
        }
        
        return result;
    }
    
    /**
     * Raycast from point to point
     * @param {number} startX - Start X
     * @param {number} startY - Start Y
     * @param {number} endX - End X
     * @param {number} endY - End Y
     * @param {string} layer - Layer filter (optional)
     * @returns {Object|null} Hit result or null
     */
    raycast(startX, startY, endX, endY, layer = null) {
        // Simple line-rectangle intersection
        for (const [id, body] of this.bodies) {
            if (layer && body.layer !== layer) continue;
            
            if (this.lineIntersectsRect(startX, startY, endX, endY, body)) {
                return {
                    body,
                    point: this.getIntersectionPoint(startX, startY, endX, endY, body)
                };
            }
        }
        
        return null;
    }
    
    /**
     * Check if line intersects rectangle
     * @param {number} x1 - Line start X
     * @param {number} y1 - Line start Y
     * @param {number} x2 - Line end X
     * @param {number} y2 - Line end Y
     * @param {Object} rect - Rectangle body
     * @returns {boolean} True if intersects
     */
    lineIntersectsRect(x1, y1, x2, y2, rect) {
        // Use separating axis theorem for line-rectangle intersection
        const rectLeft = rect.x;
        const rectRight = rect.x + rect.width;
        const rectTop = rect.y;
        const rectBottom = rect.y + rect.height;
        
        // Check if line is completely outside rectangle
        if ((x1 < rectLeft && x2 < rectLeft) ||
            (x1 > rectRight && x2 > rectRight) ||
            (y1 < rectTop && y2 < rectTop) ||
            (y1 > rectBottom && y2 > rectBottom)) {
            return false;
        }
        
        // Check if either endpoint is inside rectangle
        if ((x1 >= rectLeft && x1 <= rectRight && y1 >= rectTop && y1 <= rectBottom) ||
            (x2 >= rectLeft && x2 <= rectRight && y2 >= rectTop && y2 <= rectBottom)) {
            return true;
        }
        
        // Check line intersection with rectangle edges
        return this.lineIntersectsLine(x1, y1, x2, y2, rectLeft, rectTop, rectRight, rectTop) ||
               this.lineIntersectsLine(x1, y1, x2, y2, rectRight, rectTop, rectRight, rectBottom) ||
               this.lineIntersectsLine(x1, y1, x2, y2, rectRight, rectBottom, rectLeft, rectBottom) ||
               this.lineIntersectsLine(x1, y1, x2, y2, rectLeft, rectBottom, rectLeft, rectTop);
    }
    
    /**
     * Check if two lines intersect
     * @param {number} x1 - First line start X
     * @param {number} y1 - First line start Y
     * @param {number} x2 - First line end X
     * @param {number} y2 - First line end Y
     * @param {number} x3 - Second line start X
     * @param {number} y3 - Second line start Y
     * @param {number} x4 - Second line end X
     * @param {number} y4 - Second line end Y
     * @returns {boolean} True if lines intersect
     */
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denominator === 0) return false; // Lines are parallel
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    /**
     * Get intersection point between line and rectangle
     * @param {number} x1 - Line start X
     * @param {number} y1 - Line start Y
     * @param {number} x2 - Line end X
     * @param {number} y2 - Line end Y
     * @param {Object} rect - Rectangle body
     * @returns {Object} Intersection point
     */
    getIntersectionPoint(x1, y1, x2, y2, rect) {
        // Simplified - return midpoint for now
        return {
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2
        };
    }
    
    /**
     * Clean up collision tracking
     */
    cleanupCollisions() {
        for (const [id, body] of this.bodies) {
            const stillColliding = new Set();
            
            for (const otherId of body.collidingWith) {
                const otherBody = this.getBody(otherId);
                if (otherBody && this.checkCollision(body, otherBody)) {
                    stillColliding.add(otherId);
                } else {
                    // Collision ended
                    if (body.onCollisionExit) body.onCollisionExit(otherBody);
                }
            }
            
            body.collidingWith = stillColliding;
        }
    }
    
    /**
     * Reset physics engine
     */
    reset() {
        this.bodies.clear();
        this.collisionPairs = [];
        console.log('⚡ Physics Engine reset');
    }
}

// Create global physics engine instance
window.physicsEngine = new PhysicsEngine();

console.log('⚡ Physics Engine module loaded');
