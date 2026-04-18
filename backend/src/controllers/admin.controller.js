const db = require('../db');
const { randomUUID } = require('crypto');
const { success, error } = require('../utils/response');
const { getPrimaryRole, normalizeRoles } = require('../middlewares/rbac.middleware');
const { ASSIGNABLE_APP_ROLES, normalizeRole, toStorageRole } = require('../utils/roles');

const ALLOWED_ROLES = ASSIGNABLE_APP_ROLES;
const ALLOWED_CONTENT_TYPES = ['article', 'audio', 'video'];
const ALLOWED_CONTENT_CATEGORIES = [
  'general',
  'tahliya',
  'takhliya',
  'tajalli',
  'psychological',
  'sudan',
  'quran',
  'values',
  'community',
  'sudan_awareness',
  'arab_awareness',
  'islamic_awareness',
];
const ALLOWED_PINNED_ENTITY_TYPES = ['content', 'post', 'workshop', 'room', 'course'];

function toInt(value, fallback, { min = 1, max = 100 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function normalizeUserRoleInput(role) {
  if (role === undefined || role === null || String(role).trim() === '') {
    return null;
  }

  const normalized = normalizeRole(String(role || '').trim().toLowerCase());
  return ALLOWED_ROLES.includes(normalized) ? normalized : null;
}

function normalizeContentType(type) {
  const normalized = String(type || '').trim().toLowerCase();
  return ALLOWED_CONTENT_TYPES.includes(normalized) ? normalized : null;
}

function normalizeContentCategory(category) {
  const normalized = String(category || '').trim().toLowerCase();
  return ALLOWED_CONTENT_CATEGORIES.includes(normalized) ? normalized : null;
}

function normalizePinnedEntityType(entityType) {
  const normalized = String(entityType || '').trim().toLowerCase();
  return ALLOWED_PINNED_ENTITY_TYPES.includes(normalized) ? normalized : null;
}

function mapUserRow(row) {
  const roles = normalizeRoles(row.roles || [], { fallback: 'member' });

  return {
    ...row,
    roles,
    role: getPrimaryRole(roles, { fallback: 'member' }),
  };
}

async function fetchUserById(userId) {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.email,
        u.is_verified,
        u.created_at,
        p.full_name,
        p.avatar_url,
        p.country,
        COALESCE(array_remove(array_agg(DISTINCT ur.role::text), NULL), '{}') AS roles
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, p.full_name, p.avatar_url, p.country
    `,
    [userId]
  );

  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

function buildUpdateStatement(payload, allowedColumns) {
  const fields = [];
  const values = [];

  for (const column of allowedColumns) {
    if (payload[column] !== undefined) {
      values.push(payload[column]);
      fields.push(`${column} = $${values.length}`);
    }
  }

  return { fields, values };
}

function getRequestIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || null;
}

async function insertAuditLog(executor, req, { action, entityType, entityId = null, details = {} }) {
  const queryExecutor = executor?.query ? executor : db;

  await queryExecutor.query(
    `
      INSERT INTO admin_audit_logs (actor_id, actor_role, action, entity_type, entity_id, request_ip, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      req.user?.id || null,
      normalizeUserRoleInput(req.user?.role) || null,
      action,
      entityType,
      entityId,
      getRequestIp(req),
      JSON.stringify(details || {}),
    ]
  );
}

class AdminController {
  static async getStats(_req, res, next) {
    try {
      const [
        userMetricsResult,
        overviewMetricsResult,
        signupsResult,
        contentDistributionResult,
        recentActivityResult,
        pendingApprovalsResult,
      ] = await Promise.all([
        db.query(`
          SELECT
            COUNT(*)::int AS total_users,
            COUNT(*) FILTER (WHERE is_verified)::int AS verified_users,
            COUNT(*) FILTER (WHERE 'admin' = ANY(roles))::int AS admins,
            COUNT(*) FILTER (WHERE 'moderator' = ANY(roles))::int AS moderators,
            COUNT(*) FILTER (WHERE 'trainer' = ANY(roles))::int AS trainers,
            COUNT(*) FILTER (
              WHERE NOT ('admin' = ANY(roles) OR 'moderator' = ANY(roles) OR 'trainer' = ANY(roles))
            )::int AS students
          FROM (
            SELECT
              u.id,
              u.is_verified,
              COALESCE(array_remove(array_agg(ur.role::text), NULL), '{}') AS roles
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            GROUP BY u.id
          ) AS role_summary
        `),
        db.query(`
          SELECT
            (SELECT COUNT(*) FROM contents)::int AS total_contents,
            (SELECT COUNT(*) FROM workshops)::int AS total_workshops,
            (SELECT COUNT(*) FROM rooms)::int AS total_rooms,
            (SELECT COUNT(*) FROM audio_rooms WHERE status = 'live')::int AS total_live_rooms,
            (SELECT COUNT(*) FROM trainer_courses)::int AS total_courses,
            (SELECT COUNT(*) FROM pinned_content)::int AS total_pinned,
            (
              (SELECT COUNT(*) FROM workshops WHERE COALESCE(is_approved, false) = false) +
              (SELECT COUNT(*) FROM rooms WHERE COALESCE(is_approved, false) = false) +
              (SELECT COUNT(*) FROM trainer_courses WHERE COALESCE(is_approved, false) = false)
            )::int AS pending_approvals
        `),
        db.query(`
          WITH days AS (
            SELECT generate_series(
              CURRENT_DATE - INTERVAL '6 day',
              CURRENT_DATE,
              INTERVAL '1 day'
            )::date AS day
          ),
          signups AS (
            SELECT DATE(created_at) AS day, COUNT(*)::int AS total
            FROM users
            WHERE created_at >= CURRENT_DATE - INTERVAL '6 day'
            GROUP BY DATE(created_at)
          )
          SELECT
            TO_CHAR(days.day, 'DD Mon') AS label,
            COALESCE(signups.total, 0)::int AS total
          FROM days
          LEFT JOIN signups ON signups.day = days.day
          ORDER BY days.day ASC
        `),
        db.query(`
          SELECT type AS name, COUNT(*)::int AS value
          FROM contents
          GROUP BY type
          ORDER BY COUNT(*) DESC, type ASC
        `),
        db.query(`
          SELECT *
          FROM (
            SELECT
              created_at,
              'content' AS entity_type,
              title,
              'تمت إضافة مادة جديدة للمكتبة' AS description
            FROM contents

            UNION ALL

            SELECT
              created_at,
              'post' AS entity_type,
              title,
              'نشاط جديد في المجتمع' AS description
            FROM posts

            UNION ALL

            SELECT
              created_at,
              'workshop' AS entity_type,
              title,
              CASE
                WHEN COALESCE(is_approved, false) THEN 'ورشة معتمدة وجاهزة للنشر'
                ELSE 'ورشة بانتظار الاعتماد'
              END AS description
            FROM workshops

            UNION ALL

            SELECT
              created_at,
              'course' AS entity_type,
              title,
              CASE
                WHEN COALESCE(is_approved, false) THEN 'دورة مدرب معتمدة'
                ELSE 'دورة مدرب بانتظار الاعتماد'
              END AS description
            FROM trainer_courses
          ) AS activity_feed
          ORDER BY created_at DESC
          LIMIT 8
        `),
        db.query(`
          SELECT *
          FROM (
            SELECT
              id,
              title,
              'workshop' AS entity_type,
              created_at
            FROM workshops
            WHERE COALESCE(is_approved, false) = false

            UNION ALL

            SELECT
              id,
              title,
              'room' AS entity_type,
              created_at
            FROM rooms
            WHERE COALESCE(is_approved, false) = false

            UNION ALL

            SELECT
              id,
              title,
              'course' AS entity_type,
              created_at
            FROM trainer_courses
            WHERE COALESCE(is_approved, false) = false
          ) AS pending_items
          ORDER BY created_at DESC
          LIMIT 8
        `),
      ]);

      const users = userMetricsResult.rows[0] || {};
      const overview = overviewMetricsResult.rows[0] || {};

      return success(res, {
        overview: {
          totalUsers: users.total_users || 0,
          verifiedUsers: users.verified_users || 0,
          admins: users.admins || 0,
          moderators: users.moderators || 0,
          trainers: users.trainers || 0,
          members: users.students || 0,
          students: users.students || 0,
          totalContents: overview.total_contents || 0,
          totalWorkshops: overview.total_workshops || 0,
          totalRooms: overview.total_rooms || 0,
          totalLiveRooms: overview.total_live_rooms || 0,
          totalCourses: overview.total_courses || 0,
          totalPinned: overview.total_pinned || 0,
          pendingApprovals: overview.pending_approvals || 0,
        },
        trends: {
          dailySignups: signupsResult.rows,
          contentDistribution: contentDistributionResult.rows,
        },
        recentActivity: recentActivityResult.rows,
        pendingApprovals: pendingApprovalsResult.rows,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listUsers(req, res, next) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const roleFilter = normalizeUserRoleInput(req.query.role);
      const limit = toInt(req.query.limit, 50, { min: 1, max: 200 });

      const params = [];
      let whereClause = '';

      if (search) {
        params.push(`%${escapeLike(search.toLowerCase())}%`);
        whereClause = `
          WHERE
            LOWER(COALESCE(p.full_name, '')) LIKE $${params.length} ESCAPE '\\'
            OR LOWER(u.email) LIKE $${params.length} ESCAPE '\\'
        `;
      }

      params.push(limit);

      const result = await db.query(
        `
          SELECT
            u.id,
            u.email,
            u.is_verified,
            u.created_at,
            p.full_name,
            p.avatar_url,
            p.country,
            COALESCE(array_remove(array_agg(DISTINCT ur.role::text), NULL), '{}') AS roles
          FROM users u
          LEFT JOIN profiles p ON p.id = u.id
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          ${whereClause}
          GROUP BY u.id, p.full_name, p.avatar_url, p.country
          ORDER BY u.created_at DESC
          LIMIT $${params.length}
        `,
        params
      );

      let users = result.rows.map(mapUserRow);
      if (roleFilter) {
        users = users.filter((user) => user.role === roleFilter || user.roles.includes(roleFilter));
      }

      return success(res, {
        users,
        filters: {
          search,
          role: roleFilter,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUserRole(req, res, next) {
    const role = normalizeUserRoleInput(req.body?.role);
    if (!role) {
      return error(res, 'Invalid role supplied', 400, 'INVALID_ROLE');
    }

    const existingUser = await fetchUserById(req.params.id);
    if (!existingUser) {
      return error(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    const client = await db.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [req.params.id]);
      await client.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [
        req.params.id,
        toStorageRole(role),
      ]);
      await client.query('COMMIT');

      const user = await fetchUserById(req.params.id);
      await insertAuditLog(db, req, {
        action: 'user.role.updated',
        entityType: 'user',
        entityId: req.params.id,
        details: {
          previous_role: existingUser.role,
          next_role: user?.role || role,
          email: existingUser.email,
        },
      });
      return success(res, { user }, 'User role updated successfully');
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }

  static async listContents(req, res, next) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const type = normalizeContentType(req.query.type);
      const category = normalizeContentCategory(req.query.category);
      const limit = toInt(req.query.limit, 60, { min: 1, max: 200 });

      const params = [];
      const filters = [];

      if (search) {
        params.push(`%${escapeLike(search.toLowerCase())}%`);
        filters.push(
          `(LOWER(title) LIKE $${params.length} ESCAPE '\\' OR LOWER(COALESCE(description, '')) LIKE $${params.length} ESCAPE '\\')`
        );
      }

      if (type) {
        params.push(type);
        filters.push(`type = $${params.length}`);
      }

      if (category) {
        params.push(category);
        filters.push(`category = $${params.length}`);
      }

      params.push(limit);

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      const result = await db.query(
        `
          SELECT *
          FROM contents
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${params.length}
        `,
        params
      );

      return success(res, {
        contents: result.rows,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createContent(req, res, next) {
    try {
      const type = normalizeContentType(req.body?.type);
      const category = normalizeContentCategory(req.body?.category);

      if (!req.body?.title || !type || !category) {
        return error(res, 'title, type, and category are required', 400, 'INVALID_CONTENT_PAYLOAD');
      }

      const payload = {
        title: req.body.title.trim(),
        description: req.body.description?.trim() || null,
        type,
        category,
        media_url: req.body.media_url?.trim() || null,
        thumbnail_url: req.body.thumbnail_url?.trim() || null,
        content: req.body.content?.trim() || null,
        duration: req.body.duration?.trim() || null,
        depth_level: Number.parseInt(String(req.body.depth_level ?? '1'), 10) || 1,
        is_sudan_awareness: toBoolean(req.body.is_sudan_awareness, false),
        metadata: req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
      };

      const result = await db.query(
        `
          INSERT INTO contents (
            title,
            description,
            type,
            category,
            media_url,
            thumbnail_url,
            content,
            duration,
            depth_level,
            is_sudan_awareness,
            metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
          RETURNING *
        `,
        [
          payload.title,
          payload.description,
          payload.type,
          payload.category,
          payload.media_url,
          payload.thumbnail_url,
          payload.content,
          payload.duration,
          payload.depth_level,
          payload.is_sudan_awareness,
          JSON.stringify(payload.metadata),
        ]
      );

      await insertAuditLog(db, req, {
        action: 'content.created',
        entityType: 'content',
        entityId: result.rows[0].id,
        details: {
          title: result.rows[0].title,
          type: result.rows[0].type,
          category: result.rows[0].category,
        },
      });

      return success(res, { content: result.rows[0] }, 'Content created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateContent(req, res, next) {
    try {
      const contentResult = await db.query('SELECT * FROM contents WHERE id = $1', [req.params.id]);
      if (contentResult.rowCount === 0) {
        return error(res, 'Content not found', 404, 'CONTENT_NOT_FOUND');
      }

      const payload = {
        title: req.body.title?.trim(),
        description: req.body.description === '' ? null : req.body.description?.trim(),
        type: req.body.type ? normalizeContentType(req.body.type) : undefined,
        category: req.body.category ? normalizeContentCategory(req.body.category) : undefined,
        media_url: req.body.media_url === '' ? null : req.body.media_url?.trim(),
        thumbnail_url: req.body.thumbnail_url === '' ? null : req.body.thumbnail_url?.trim(),
        content: req.body.content === '' ? null : req.body.content?.trim(),
        duration: req.body.duration === '' ? null : req.body.duration?.trim(),
        depth_level:
          req.body.depth_level !== undefined
            ? Number.parseInt(String(req.body.depth_level), 10) || 1
            : undefined,
        is_sudan_awareness:
          req.body.is_sudan_awareness !== undefined
            ? toBoolean(req.body.is_sudan_awareness)
            : undefined,
        metadata:
          req.body.metadata !== undefined && typeof req.body.metadata === 'object'
            ? req.body.metadata
            : undefined,
      };

      if ((req.body.type && !payload.type) || (req.body.category && !payload.category)) {
        return error(res, 'Invalid content type or category', 400, 'INVALID_CONTENT_PAYLOAD');
      }

      const { fields, values } = buildUpdateStatement(payload, [
        'title',
        'description',
        'type',
        'category',
        'media_url',
        'thumbnail_url',
        'content',
        'duration',
        'depth_level',
        'is_sudan_awareness',
        'metadata',
      ]);

      if (fields.length === 0) {
        return success(res, { content: contentResult.rows[0] });
      }

      values.push(req.params.id);
      const result = await db.query(
        `UPDATE contents SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );

      await insertAuditLog(db, req, {
        action: 'content.updated',
        entityType: 'content',
        entityId: req.params.id,
        details: {
          changed_fields: fields.map((field) => field.split(' = ')[0]),
          title: result.rows[0].title,
        },
      });

      return success(res, { content: result.rows[0] }, 'Content updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteContent(req, res, next) {
    try {
      const result = await db.query('DELETE FROM contents WHERE id = $1 RETURNING id, title, type, category', [
        req.params.id,
      ]);
      if (result.rowCount === 0) {
        return error(res, 'Content not found', 404, 'CONTENT_NOT_FOUND');
      }

      await insertAuditLog(db, req, {
        action: 'content.deleted',
        entityType: 'content',
        entityId: req.params.id,
        details: result.rows[0],
      });

      return success(res, { id: req.params.id }, 'Content deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listPosts(req, res, next) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const limit = toInt(req.query.limit, 60, { min: 1, max: 200 });
      const params = [];
      let whereClause = '';

      if (search) {
        params.push(`%${escapeLike(search.toLowerCase())}%`);
        whereClause = `
          WHERE
            LOWER(COALESCE(p.title, '')) LIKE $${params.length} ESCAPE '\\'
            OR LOWER(COALESCE(p.body, '')) LIKE $${params.length} ESCAPE '\\'
        `;
      }

      params.push(limit);

      const result = await db.query(
        `
          SELECT
            p.*,
            pr.full_name AS author_name,
            COUNT(DISTINCT c.id)::int AS comments_count
          FROM posts p
          LEFT JOIN profiles pr ON pr.id = p.author_id
          LEFT JOIN comments c ON c.post_id = p.id
          ${whereClause}
          GROUP BY p.id, pr.full_name
          ORDER BY p.created_at DESC
          LIMIT $${params.length}
        `,
        params
      );

      return success(res, { posts: result.rows });
    } catch (err) {
      next(err);
    }
  }

  static async deletePost(req, res, next) {
    try {
      const result = await db.query('DELETE FROM posts WHERE id = $1 RETURNING id, title, category', [
        req.params.id,
      ]);
      if (result.rowCount === 0) {
        return error(res, 'Post not found', 404, 'POST_NOT_FOUND');
      }

      await insertAuditLog(db, req, {
        action: 'post.deleted',
        entityType: 'post',
        entityId: req.params.id,
        details: result.rows[0],
      });

      return success(res, { id: req.params.id }, 'Post deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listCourses(_req, res, next) {
    try {
      const result = await db.query(`
        SELECT
          tc.*,
          COALESCE(p.full_name, u.email, 'Trainer') AS trainer_name
        FROM trainer_courses tc
        LEFT JOIN profiles p ON p.id = tc.trainer_id
        LEFT JOIN users u ON u.id = tc.trainer_id
        ORDER BY tc.created_at DESC
      `);

      return success(res, { courses: result.rows });
    } catch (err) {
      next(err);
    }
  }

  static async updateCourseApproval(req, res, next) {
    try {
      const isApproved = toBoolean(req.body?.is_approved, false);
      const result = await db.query(
        `
          UPDATE trainer_courses
          SET is_approved = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `,
        [isApproved, req.params.id]
      );

      if (result.rowCount === 0) {
        return error(res, 'Course not found', 404, 'COURSE_NOT_FOUND');
      }

      await insertAuditLog(db, req, {
        action: 'course.approval.updated',
        entityType: 'course',
        entityId: req.params.id,
        details: {
          is_approved: result.rows[0].is_approved,
          title: result.rows[0].title,
        },
      });

      return success(res, { course: result.rows[0] }, 'Course approval updated');
    } catch (err) {
      next(err);
    }
  }

  static async listWorkshops(_req, res, next) {
    try {
      const result = await db.query(`
        SELECT
          w.*,
          COALESCE(p.full_name, u.email, 'Trainer') AS trainer_name
        FROM workshops w
        LEFT JOIN profiles p ON p.id = w.trainer_id
        LEFT JOIN users u ON u.id = w.trainer_id
        ORDER BY w.scheduled_at ASC NULLS LAST, w.created_at DESC
      `);

      return success(res, { workshops: result.rows });
    } catch (err) {
      next(err);
    }
  }

  static async updateWorkshopApproval(req, res, next) {
    try {
      const isApproved = toBoolean(req.body?.is_approved, false);
      const result = await db.query(
        `
          UPDATE workshops
          SET is_approved = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `,
        [isApproved, req.params.id]
      );

      if (result.rowCount === 0) {
        return error(res, 'Workshop not found', 404, 'WORKSHOP_NOT_FOUND');
      }

      await insertAuditLog(db, req, {
        action: 'workshop.approval.updated',
        entityType: 'workshop',
        entityId: req.params.id,
        details: {
          is_approved: result.rows[0].is_approved,
          title: result.rows[0].title,
        },
      });

      return success(res, { workshop: result.rows[0] }, 'Workshop approval updated');
    } catch (err) {
      next(err);
    }
  }

  static async listRooms(_req, res, next) {
    try {
      const [roomsResult, liveRoomsResult] = await Promise.all([
        db.query(`
          SELECT
            r.*,
            COALESCE(p.full_name, u.email, 'Host') AS host_name
          FROM rooms r
          LEFT JOIN profiles p ON p.id = r.host_id
          LEFT JOIN users u ON u.id = r.host_id
          ORDER BY r.scheduled_at ASC NULLS LAST, r.created_at DESC
        `),
        db.query(`
          SELECT
            ar.*,
            COALESCE(p.full_name, u.email, 'Host') AS host_name
          FROM audio_rooms ar
          LEFT JOIN profiles p ON p.id = ar.created_by
          LEFT JOIN users u ON u.id = ar.created_by
          ORDER BY ar.created_at DESC
        `),
      ]);

      return success(res, {
        rooms: roomsResult.rows,
        liveRooms: liveRoomsResult.rows,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateRoomApproval(req, res, next) {
    try {
      const isApproved = toBoolean(req.body?.is_approved, false);
      const result = await db.query(
        `
          UPDATE rooms
          SET is_approved = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `,
        [isApproved, req.params.id]
      );

      if (result.rowCount === 0) {
        return error(res, 'Room not found', 404, 'ROOM_NOT_FOUND');
      }

      await insertAuditLog(db, req, {
        action: 'room.approval.updated',
        entityType: 'room',
        entityId: req.params.id,
        details: {
          is_approved: result.rows[0].is_approved,
          title: result.rows[0].title,
        },
      });

      return success(res, { room: result.rows[0] }, 'Room approval updated');
    } catch (err) {
      next(err);
    }
  }

  static async listPinned(_req, res, next) {
    try {
      const result = await db.query(`
        SELECT *
        FROM pinned_content
        ORDER BY sort_order ASC, created_at DESC
      `);

      return success(res, { pinned: result.rows });
    } catch (err) {
      next(err);
    }
  }

  static async createPinned(req, res, next) {
    try {
      const entityType = normalizePinnedEntityType(req.body?.entity_type);
      if (!entityType || !req.body?.entity_id || !req.body?.title) {
        return error(res, 'entity_type, entity_id, and title are required', 400, 'INVALID_PINNED_PAYLOAD');
      }

      const result = await db.query(
        `
          INSERT INTO pinned_content (
            entity_type,
            entity_id,
            title,
            subtitle,
            thumbnail_url,
            sort_order,
            pinned_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
        [
          entityType,
          req.body.entity_id,
          req.body.title.trim(),
          req.body.subtitle?.trim() || null,
          req.body.thumbnail_url?.trim() || null,
          Number.parseInt(String(req.body.sort_order ?? '0'), 10) || 0,
          req.user.id,
        ]
      );

      await insertAuditLog(db, req, {
        action: 'pinned.created',
        entityType: 'pinned',
        entityId: result.rows[0].id,
        details: {
          entity_type: result.rows[0].entity_type,
          entity_id: result.rows[0].entity_id,
          title: result.rows[0].title,
          sort_order: result.rows[0].sort_order,
        },
      });

      return success(res, { pinned: result.rows[0] }, 'Pinned content created', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updatePinned(req, res, next) {
    try {
      const pinnedResult = await db.query('SELECT * FROM pinned_content WHERE id = $1', [req.params.id]);
      if (pinnedResult.rowCount === 0) {
        return error(res, 'Pinned item not found', 404, 'PINNED_NOT_FOUND');
      }

      const payload = {
        entity_type: req.body.entity_type ? normalizePinnedEntityType(req.body.entity_type) : undefined,
        entity_id: req.body.entity_id === '' ? null : req.body.entity_id?.trim(),
        title: req.body.title === '' ? null : req.body.title?.trim(),
        subtitle: req.body.subtitle === '' ? null : req.body.subtitle?.trim(),
        thumbnail_url: req.body.thumbnail_url === '' ? null : req.body.thumbnail_url?.trim(),
        sort_order:
          req.body.sort_order !== undefined
            ? Number.parseInt(String(req.body.sort_order), 10) || 0
            : undefined,
      };

      if (
        (req.body.entity_type && !payload.entity_type) ||
        (req.body.entity_id !== undefined && !payload.entity_id) ||
        (req.body.title !== undefined && !payload.title)
      ) {
        return error(res, 'Invalid pinned payload', 400, 'INVALID_PINNED_PAYLOAD');
      }

      const { fields, values } = buildUpdateStatement(payload, [
        'entity_type',
        'entity_id',
        'title',
        'subtitle',
        'thumbnail_url',
        'sort_order',
      ]);

      if (fields.length === 0) {
        return success(res, { pinned: pinnedResult.rows[0] });
      }

      values.push(req.params.id);
      const result = await db.query(
        `UPDATE pinned_content SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );

      await insertAuditLog(db, req, {
        action: 'pinned.updated',
        entityType: 'pinned',
        entityId: req.params.id,
        details: {
          changed_fields: fields.map((field) => field.split(' = ')[0]),
          title: result.rows[0].title,
          entity_type: result.rows[0].entity_type,
          entity_id: result.rows[0].entity_id,
          sort_order: result.rows[0].sort_order,
        },
      });

      return success(res, { pinned: result.rows[0] }, 'Pinned item updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deletePinned(req, res, next) {
    try {
      const result = await db.query(
        'DELETE FROM pinned_content WHERE id = $1 RETURNING id, entity_type, entity_id, title, sort_order',
        [req.params.id]
      );
      if (result.rowCount === 0) {
        return error(res, 'Pinned item not found', 404, 'PINNED_NOT_FOUND');
      }

      await insertAuditLog(db, req, {
        action: 'pinned.deleted',
        entityType: 'pinned',
        entityId: req.params.id,
        details: result.rows[0],
      });

      return success(res, { id: req.params.id }, 'Pinned item deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listNotifications(_req, res, next) {
    try {
      const result = await db.query(`
        SELECT
          MIN(n.id)::text AS id,
          COALESCE(n.batch_id::text, MIN(n.id)::text) AS batch_id,
          n.title,
          n.message,
          n.type,
          actor_profile.full_name AS actor_name,
          MAX(n.created_at) AS created_at,
          COUNT(*)::int AS delivered_count
        FROM notifications n
        LEFT JOIN profiles actor_profile ON actor_profile.id = n.actor_id
        GROUP BY COALESCE(n.batch_id::text, n.id::text), n.title, n.message, n.type, actor_profile.full_name
        ORDER BY MAX(n.created_at) DESC
        LIMIT 30
      `);

      return success(res, { notifications: result.rows });
    } catch (err) {
      next(err);
    }
  }

  static async listAuditLogs(req, res, next) {
    try {
      const limit = toInt(req.query.limit, 50, { min: 1, max: 200 });
      const result = await db.query(
        `
          SELECT
            l.*,
            actor_profile.full_name AS actor_name,
            actor_user.email AS actor_email
          FROM admin_audit_logs l
          LEFT JOIN profiles actor_profile ON actor_profile.id = l.actor_id
          LEFT JOIN users actor_user ON actor_user.id = l.actor_id
          ORDER BY l.created_at DESC
          LIMIT $1
        `,
        [limit]
      );

      return success(res, { audit_logs: result.rows });
    } catch (err) {
      next(err);
    }
  }

  static async broadcastNotification(req, res, next) {
    try {
      const title = req.body?.title?.trim();
      const message = req.body?.message?.trim();
      const type = req.body?.type?.trim() || 'system';
      const targetRole = req.body?.target_role ? normalizeUserRoleInput(req.body.target_role) : null;
      const target = targetRole || 'all';

      if (!title || !message) {
        return error(res, 'title and message are required', 400, 'INVALID_NOTIFICATION_PAYLOAD');
      }

      const usersResult = await db.query(`
        SELECT
          u.id,
          COALESCE(array_remove(array_agg(ur.role::text), NULL), '{}') AS roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        GROUP BY u.id
      `);

      const recipientIds = usersResult.rows
        .map((row) => ({
          id: row.id,
          roles: normalizeRoles(row.roles || [], { fallback: 'member' }),
        }))
        .filter((user) => target === 'all' || user.roles.includes(target) || getPrimaryRole(user.roles) === target)
        .map((user) => user.id);

      if (recipientIds.length === 0) {
        return error(res, 'No recipients matched the selected audience', 404, 'NO_RECIPIENTS');
      }

      const batchId = randomUUID();

      const insertResult = await db.query(
        `
          INSERT INTO notifications (user_id, batch_id, type, title, message, actor_id)
          SELECT UNNEST($1::uuid[]), $2, $3, $4, $5, $6
          RETURNING id
        `,
        [recipientIds, batchId, type, title, message, req.user.id]
      );

      await insertAuditLog(db, req, {
        action: 'notification.broadcast',
        entityType: 'notification',
        entityId: null,
        details: {
          batch_id: batchId,
          title,
          type,
          audience: target,
          delivered: insertResult.rowCount,
        },
      });

      return success(
        res,
        {
          batch_id: batchId,
          delivered: insertResult.rowCount,
          audience: target,
        },
        'Notification broadcast completed',
        201
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
