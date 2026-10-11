export const PYGAME_PACMAN_PYTHON_CODE = `"""
Pac-Man Arcade in Pygame
A faithful retro arcade recreation built with Python and Pygame.
Run with:
    pip install pygame
    python pacman.py
"""

import math
import random
import pygame

# -------------------------------------------------------------
# Configuration & Constants
# -------------------------------------------------------------
TILE_SIZE = 20
COLS = 28
ROWS = 31
SCREEN_WIDTH = COLS * TILE_SIZE
SCREEN_HEIGHT = (ROWS + 3) * TILE_SIZE  # Extra space for scoreboard & lives
FPS = 60

# Colors (Classic 80s arcade palette)
BLACK = (5, 7, 15)
BLUE = (37, 99, 235)
WHITE = (255, 255, 255)
YELLOW = (250, 204, 21)
PELLET_COLOR = (253, 230, 138)
GATE_COLOR = (244, 114, 182)

GHOST_COLORS = {
    'BLINKY': (255, 0, 0),      # Red
    'PINKY': (255, 184, 255),   # Pink
    'INKY': (0, 255, 255),      # Cyan
    'CLYDE': (255, 184, 82),    # Orange
}
FRIGHTENED_COLOR = (37, 99, 235)

# Maze Map: '#' = Wall, '.' = Pellet, 'o' = Power Pellet, '-' = Door, ' ' = Empty
MAZE = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "     #.##### ## #####.#     ",
    "     #.##    --    ##.#     ",
    "     #.## ###==### ##.#     ",
    "######.## #      # ##.######",
    "      .   #      #   .      ",
    "######.## #      # ##.######",
    "     #.## ######## ##.#     ",
    "     #.##          ##.#     ",
    "     #.## ######## ##.#     ",
    "######.## ######## ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#.####.#####.##.#####.####.#",
    "#o..##................##..o#",
    "###.##.##.########.##.##.###",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################",
]

# -------------------------------------------------------------
# Entity Classes
# -------------------------------------------------------------
class Pacman:
    def __init__(self, col=13.5, row=23):
        self.start_col = col
        self.start_row = row
        self.reset()

    def reset(self):
        self.x = self.start_col * TILE_SIZE
        self.y = self.start_row * TILE_SIZE
        self.dir_x = 0
        self.dir_y = 0
        self.next_dir_x = 0
        self.next_dir_y = 0
        self.speed = 1.4  # Slower, smooth arcade pace
        self.mouth_angle = 0
        self.mouth_speed = 0.08
        self.alive = True

    def set_next_direction(self, dx, dy):
        self.next_dir_x = dx
        self.next_dir_y = dy

    def can_move(self, grid, dx, dy):
        curr_col = int(round(self.x / TILE_SIZE))
        curr_row = int(round(self.y / TILE_SIZE))
        next_col = curr_col + dx
        next_row = curr_row + dy

        # Check wrap tunnel
        if next_row == 14 and (next_col < 0 or next_col >= COLS):
            return True

        if 0 <= next_row < ROWS and 0 <= next_col < COLS:
            cell = grid[next_row][next_col]
            return cell not in ('#', '=', '-')
        return False

    def update(self, grid):
        if not self.alive:
            return

        # Animate mouth
        self.mouth_angle += self.mouth_speed
        if self.mouth_angle > 0.45 or self.mouth_angle < 0.05:
            self.mouth_speed = -self.mouth_speed

        # Attempt to change direction at tile alignment
        at_center_x = (int(self.x) % TILE_SIZE) < 3
        at_center_y = (int(self.y) % TILE_SIZE) < 3

        if (self.next_dir_x != 0 or self.next_dir_y != 0) and at_center_x and at_center_y:
            if self.can_move(grid, self.next_dir_x, self.next_dir_y):
                self.dir_x = self.next_dir_x
                self.dir_y = self.next_dir_y
                self.x = round(self.x / TILE_SIZE) * TILE_SIZE
                self.y = round(self.y / TILE_SIZE) * TILE_SIZE

        # Move if forward path is clear
        if self.can_move(grid, self.dir_x, self.dir_y):
            self.x += self.dir_x * self.speed
            self.y += self.dir_y * self.speed
        else:
            # Snap to grid
            if self.dir_x != 0:
                self.x = round(self.x / TILE_SIZE) * TILE_SIZE
            if self.dir_y != 0:
                self.y = round(self.y / TILE_SIZE) * TILE_SIZE

        # Tunnel wrap
        if self.y // TILE_SIZE == 14:
            if self.x < -TILE_SIZE:
                self.x = (COLS - 1) * TILE_SIZE
            elif self.x > (COLS - 1) * TILE_SIZE:
                self.x = 0

    def draw(self, surface):
        px = int(self.x + TILE_SIZE / 2)
        py = int(self.y + TILE_SIZE / 2 + 2 * TILE_SIZE)
        radius = int(TILE_SIZE * 0.7)

        # Base circle
        pygame.draw.circle(surface, YELLOW, (px, py), radius)

        # Mouth wedge cutout
        if self.dir_x != 0 or self.dir_y != 0:
            angle = 0
            if self.dir_x == 1: angle = 0
            elif self.dir_y == 1: angle = math.pi / 2
            elif self.dir_x == -1: angle = math.pi
            elif self.dir_y == -1: angle = -math.pi / 2

            p1 = (px, py)
            p2 = (px + radius * 1.5 * math.cos(angle - self.mouth_angle),
                  py + radius * 1.5 * math.sin(angle - self.mouth_angle))
            p3 = (px + radius * 1.5 * math.cos(angle + self.mouth_angle),
                  py + radius * 1.5 * math.sin(angle + self.mouth_angle))
            pygame.draw.polygon(surface, BLACK, [p1, p2, p3])


class Ghost:
    def __init__(self, name, col, row, color):
        self.name = name
        self.start_col = col
        self.start_row = row
        self.color = color
        self.reset()

    def reset(self):
        self.x = self.start_col * TILE_SIZE
        self.y = self.start_row * TILE_SIZE
        self.dir_x = 0
        self.dir_y = -1
        self.speed = 1.2
        self.mode = 'CHASE'  # CHASE, FRIGHTENED, EATEN
        self.frightened_timer = 0

    def update(self, grid, pacman):
        if self.mode == 'FRIGHTENED':
            self.frightened_timer -= 1
            if self.frightened_timer <= 0:
                self.mode = 'CHASE'

        curr_col = int(round(self.x / TILE_SIZE))
        curr_row = int(round(self.y / TILE_SIZE))

        # Check turn at intersections
        at_center = (int(self.x) % TILE_SIZE < 3) and (int(self.y) % TILE_SIZE < 3)
        if at_center:
            options = [(0, -1), (-1, 0), (0, 1), (1, 0)]
            opposite = (-self.dir_x, -self.dir_y)
            valid = []

            for dx, dy in options:
                if (dx, dy) == opposite:
                    continue
                nc = curr_col + dx
                nr = curr_row + dy
                if 0 <= nr < ROWS and 0 <= nc < COLS:
                    if grid[nr][nc] not in ('#', '='):
                        valid.append((dx, dy))

            if valid:
                if self.mode == 'FRIGHTENED':
                    self.dir_x, self.dir_y = random.choice(valid)
                else:
                    # Target Pacman
                    target_x = pacman.x
                    target_y = pacman.y
                    best_dir = valid[0]
                    min_dist = float('inf')
                    for dx, dy in valid:
                        next_x = (curr_col + dx) * TILE_SIZE
                        next_y = (curr_row + dy) * TILE_SIZE
                        dist = (next_x - target_x) ** 2 + (next_y - target_y) ** 2
                        if dist < min_dist:
                            min_dist = dist
                            best_dir = (dx, dy)
                    self.dir_x, self.dir_y = best_dir

        current_speed = self.speed * 0.6 if self.mode == 'FRIGHTENED' else self.speed
        self.x += self.dir_x * current_speed
        self.y += self.dir_y * current_speed

        # Tunnel wrap
        if self.y // TILE_SIZE == 14:
            if self.x < -TILE_SIZE:
                self.x = (COLS - 1) * TILE_SIZE
            elif self.x > (COLS - 1) * TILE_SIZE:
                self.x = 0

    def draw(self, surface):
        px = int(self.x + TILE_SIZE / 2)
        py = int(self.y + TILE_SIZE / 2 + 2 * TILE_SIZE)
        radius = int(TILE_SIZE * 0.7)

        color = FRIGHTENED_COLOR if self.mode == 'FRIGHTENED' else self.color
        # Dome head
        pygame.draw.circle(surface, color, (px, py - 2), radius)
        # Skirt rectangle
        pygame.draw.rect(surface, color, (px - radius, py - 2, radius * 2, radius))
        # Skirt wave notches
        for i in range(3):
            wx = px - radius + (i * 2 + 1) * (radius * 2 // 6)
            pygame.draw.circle(surface, BLACK, (wx, py + radius - 2), 2)

        # Eyes
        eye_color = WHITE if self.mode != 'FRIGHTENED' else (255, 200, 200)
        pygame.draw.circle(surface, eye_color, (px - 4, py - 3), 3)
        pygame.draw.circle(surface, eye_color, (px + 4, py - 3), 3)
        if self.mode != 'FRIGHTENED':
            pygame.draw.circle(surface, BLUE, (px - 4 + self.dir_x * 2, py - 3 + self.dir_y * 2), 1.5)
            pygame.draw.circle(surface, BLUE, (px + 4 + self.dir_x * 2, py - 3 + self.dir_y * 2), 1.5)


# -------------------------------------------------------------
# Main Game Loop
# -------------------------------------------------------------
def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Pac-Man Arcade")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 24)

    # Initialize Grid
    grid = [list(row) for row in MAZE]
    pacman = Pacman()
    ghosts = [
        Ghost('BLINKY', 13.5, 11, GHOST_COLORS['BLINKY']),
        Ghost('PINKY', 13.5, 14, GHOST_COLORS['PINKY']),
        Ghost('INKY', 11.5, 14, GHOST_COLORS['INKY']),
        Ghost('CLYDE', 15.5, 14, GHOST_COLORS['CLYDE']),
    ]

    score = 0
    lives = 3
    game_over = False

    running = True
    while running:
        clock.tick(FPS)

        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_LEFT, pygame.K_a):
                    pacman.set_next_direction(-1, 0)
                elif event.key in (pygame.K_RIGHT, pygame.K_d):
                    pacman.set_next_direction(1, 0)
                elif event.key in (pygame.K_UP, pygame.K_w):
                    pacman.set_next_direction(0, -1)
                elif event.key in (pygame.K_DOWN, pygame.K_s):
                    pacman.set_next_direction(0, 1)
                elif event.key == pygame.K_r and game_over:
                    # Restart
                    grid = [list(row) for row in MAZE]
                    pacman.reset()
                    for g in ghosts: g.reset()
                    score = 0
                    lives = 3
                    game_over = False

        if not game_over:
            # Update entities
            pacman.update(grid)
            for ghost in ghosts:
                ghost.update(grid, pacman)

            # Check pellet eating
            p_col = int(round(pacman.x / TILE_SIZE))
            p_row = int(round(pacman.y / TILE_SIZE))
            if 0 <= p_row < ROWS and 0 <= p_col < COLS:
                cell = grid[p_row][p_col]
                if cell == '.':
                    grid[p_row][p_col] = ' '
                    score += 10
                elif cell == 'o':
                    grid[p_row][p_col] = ' '
                    score += 50
                    for g in ghosts:
                        g.mode = 'FRIGHTENED'
                        g.frightened_timer = FPS * 7  # 7 seconds

            # Check ghost collisions
            for ghost in ghosts:
                dist = (pacman.x - ghost.x) ** 2 + (pacman.y - ghost.y) ** 2
                if dist < (TILE_SIZE * 0.8) ** 2:
                    if ghost.mode == 'FRIGHTENED':
                        score += 200
                        ghost.reset()
                    else:
                        lives -= 1
                        if lives <= 0:
                            game_over = True
                        else:
                            pacman.reset()
                            for g in ghosts: g.reset()

        # Rendering
        screen.fill(BLACK)

        # Draw HUD
        score_surf = font.render(f"SCORE: {score}", True, WHITE)
        screen.blit(score_surf, (16, 12))
        lives_surf = font.render(f"LIVES: {lives}", True, YELLOW)
        screen.blit(lives_surf, (SCREEN_WIDTH - 110, 12))

        # Draw Maze
        for r in range(ROWS):
            for c in range(COLS):
                char = grid[r][c]
                px = c * TILE_SIZE
                py = r * TILE_SIZE + 2 * TILE_SIZE
                if char in ('#', '='):
                    pygame.draw.rect(screen, BLUE, (px, py, TILE_SIZE, TILE_SIZE), 1)
                elif char == '-':
                    pygame.draw.line(screen, GATE_COLOR, (px, py + TILE_SIZE // 2), (px + TILE_SIZE, py + TILE_SIZE // 2), 2)
                elif char == '.':
                    pygame.draw.circle(screen, PELLET_COLOR, (px + TILE_SIZE // 2, py + TILE_SIZE // 2), 2)
                elif char == 'o':
                    pygame.draw.circle(screen, WHITE, (px + TILE_SIZE // 2, py + TILE_SIZE // 2), 5)

        # Draw Entities
        pacman.draw(screen)
        for ghost in ghosts:
            ghost.draw(screen)

        if game_over:
            over_surf = font.render("GAME OVER - PRESS R TO RESTART", True, (255, 60, 60))
            rect = over_surf.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
            screen.blit(over_surf, rect)

        pygame.display.flip()

    pygame.quit()

if __name__ == "__main__":
    main()
`;
