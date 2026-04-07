export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          id: string
          issued_at: string | null
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          id?: string
          issued_at?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          id?: string
          issued_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          category: Database["public"]["Enums"]["content_category"]
          created_at: string | null
          depth_level: Database["public"]["Enums"]["depth_level"]
          description: string | null
          id: string
          is_sudan_awareness: boolean | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["content_category"]
          created_at?: string | null
          depth_level?: Database["public"]["Enums"]["depth_level"]
          description?: string | null
          id?: string
          is_sudan_awareness?: boolean | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string | null
          depth_level?: Database["public"]["Enums"]["depth_level"]
          description?: string | null
          id?: string
          is_sudan_awareness?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          url?: string | null
        }
        Relationships: []
      }
      course_chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          course_id: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          course_id: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          course_id?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_chat_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_comments: {
        Row: {
          author_id: string
          body: string
          course_id: string
          created_at: string | null
          id: string
          parent_id: string | null
        }
        Insert: {
          author_id: string
          body: string
          course_id: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          course_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          last_accessed_at: string | null
          progress_percent: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percent?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_subscriptions: {
        Row: {
          course_id: string
          id: string
          subscribed_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          subscribed_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          subscribed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      monthly_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          paypal_subscription_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          paypal_subscription_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          paypal_subscription_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          related_course_id: string | null
          related_post_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_course_id?: string | null
          related_post_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_course_id?: string | null
          related_post_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_course_id_fkey"
            columns: ["related_course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          pinned_by: string
          ticker_position: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          pinned_by: string
          ticker_position: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          pinned_by?: string
          ticker_position?: string
        }
        Relationships: []
      }
      post_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string | null
          category: Database["public"]["Enums"]["post_category"]
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          author_id: string
          body?: string | null
          category?: Database["public"]["Enums"]["post_category"]
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string | null
          category?: Database["public"]["Enums"]["post_category"]
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          experience_years: number | null
          full_name: string | null
          id: string
          interests: string[] | null
          is_public_profile: boolean | null
          is_sudan_awareness_member: boolean | null
          social_links: Json | null
          specializations: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id: string
          interests?: string[] | null
          is_public_profile?: boolean | null
          is_sudan_awareness_member?: boolean | null
          social_links?: Json | null
          specializations?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_public_profile?: boolean | null
          is_sudan_awareness_member?: boolean | null
          social_links?: Json | null
          specializations?: string[] | null
        }
        Relationships: []
      }
      reactions: {
        Row: {
          id: string
          post_id: string
          type: string | null
          user_id: string
        }
        Insert: {
          id?: string
          post_id: string
          type?: string | null
          user_id: string
        }
        Update: {
          id?: string
          post_id?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      room_hand_raises: {
        Row: {
          created_at: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_hand_raises_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_recordings: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          is_available: boolean | null
          recorded_at: string | null
          recording_url: string | null
          room_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_available?: boolean | null
          recorded_at?: string | null
          recording_url?: string | null
          room_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_available?: boolean | null
          recorded_at?: string | null
          recording_url?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_recordings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          room_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          room_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          room_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_roles_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          access_type: string
          actual_started_at: string | null
          category: Database["public"]["Enums"]["content_category"]
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          host_id: string
          id: string
          image_url: string | null
          is_approved: boolean | null
          is_live: boolean | null
          max_participants: number | null
          peak_participants: number | null
          price: number | null
          scheduled_at: string
          title: string
          total_participants_count: number | null
          updated_at: string | null
        }
        Insert: {
          access_type?: string
          actual_started_at?: string | null
          category: Database["public"]["Enums"]["content_category"]
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          host_id: string
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_live?: boolean | null
          max_participants?: number | null
          peak_participants?: number | null
          price?: number | null
          scheduled_at: string
          title: string
          total_participants_count?: number | null
          updated_at?: string | null
        }
        Update: {
          access_type?: string
          actual_started_at?: string | null
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          host_id?: string
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_live?: boolean | null
          max_participants?: number | null
          peak_participants?: number | null
          price?: number | null
          scheduled_at?: string
          title?: string
          total_participants_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          scheduled_at: string
          service_id: string
          status: string | null
          student_id: string
          trainer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          scheduled_at: string
          service_id: string
          status?: string | null
          student_id: string
          trainer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          service_id?: string
          status?: string | null
          student_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "trainer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          service_id: string
          student_id: string
          trainer_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          service_id: string
          student_id: string
          trainer_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          service_id?: string
          student_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "trainer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainer_blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          id: string
          reason: string | null
          trainer_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string
          id?: string
          reason?: string | null
          trainer_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string
          id?: string
          reason?: string | null
          trainer_id?: string
        }
        Relationships: []
      }
      trainer_courses: {
        Row: {
          category: Database["public"]["Enums"]["content_category"]
          created_at: string | null
          depth_level: Database["public"]["Enums"]["depth_level"]
          description: string | null
          id: string
          is_approved: boolean | null
          title: string
          trainer_id: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string | null
          url: string | null
          views_count: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["content_category"]
          created_at?: string | null
          depth_level?: Database["public"]["Enums"]["depth_level"]
          description?: string | null
          id?: string
          is_approved?: boolean | null
          title: string
          trainer_id: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string | null
          url?: string | null
          views_count?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string | null
          depth_level?: Database["public"]["Enums"]["depth_level"]
          description?: string | null
          id?: string
          is_approved?: boolean | null
          title?: string
          trainer_id?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string | null
          url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      trainer_services: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          price: number | null
          service_type: string
          title: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          service_type: string
          title: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          service_type?: string
          title?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workshop_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          user_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_messages_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_participants: {
        Row: {
          id: string
          joined_at: string | null
          user_id: string
          workshop_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          user_id: string
          workshop_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_participants_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_recordings: {
        Row: {
          cloudflare_uid: string | null
          duration_seconds: number | null
          id: string
          is_available: boolean | null
          recorded_at: string | null
          recording_url: string | null
          workshop_id: string
        }
        Insert: {
          cloudflare_uid?: string | null
          duration_seconds?: number | null
          id?: string
          is_available?: boolean | null
          recorded_at?: string | null
          recording_url?: string | null
          workshop_id: string
        }
        Update: {
          cloudflare_uid?: string | null
          duration_seconds?: number | null
          id?: string
          is_available?: boolean | null
          recorded_at?: string | null
          recording_url?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_recordings_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          category: Database["public"]["Enums"]["content_category"]
          cloudflare_live_input_uid: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          host_id: string
          id: string
          image_url: string | null
          is_approved: boolean | null
          is_live: boolean | null
          max_participants: number | null
          price: number | null
          scheduled_at: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["content_category"]
          cloudflare_live_input_uid?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_id: string
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_live?: boolean | null
          max_participants?: number | null
          price?: number | null
          scheduled_at: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["content_category"]
          cloudflare_live_input_uid?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_id?: string
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_live?: boolean | null
          max_participants?: number | null
          price?: number | null
          scheduled_at?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      course_ratings_public: {
        Row: {
          course_id: string | null
          created_at: string | null
          rating: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          rating?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_subscriptions_public: {
        Row: {
          course_id: string | null
          subscriber_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          experience_years: number | null
          full_name: string | null
          id: string | null
          is_public_profile: boolean | null
          is_sudan_awareness_member: boolean | null
          specializations: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string | null
          is_public_profile?: boolean | null
          is_sudan_awareness_member?: boolean | null
          specializations?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string | null
          is_public_profile?: boolean | null
          is_sudan_awareness_member?: boolean | null
          specializations?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_certificate_number: { Args: never; Returns: string }
      get_course_avg_rating: { Args: { course_uuid: string }; Returns: number }
      get_course_rating_count: {
        Args: { course_uuid: string }
        Returns: number
      }
      get_service_avg_rating: {
        Args: { service_uuid: string }
        Returns: number
      }
      get_service_review_count: {
        Args: { service_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_chat_usage: {
        Args: { p_daily_limit: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "guest" | "member" | "moderator" | "admin" | "trainer"
      content_category:
        | "quran"
        | "values"
        | "community"
        | "sudan_awareness"
        | "arab_awareness"
        | "islamic_awareness"
      content_type: "article" | "audio" | "video"
      depth_level: "beginner" | "intermediate" | "advanced"
      post_category:
        | "general"
        | "quran"
        | "awareness"
        | "sudan_awareness"
        | "arab_awareness"
        | "islamic_awareness"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["guest", "member", "moderator", "admin", "trainer"],
      content_category: [
        "quran",
        "values",
        "community",
        "sudan_awareness",
        "arab_awareness",
        "islamic_awareness",
      ],
      content_type: ["article", "audio", "video"],
      depth_level: ["beginner", "intermediate", "advanced"],
      post_category: [
        "general",
        "quran",
        "awareness",
        "sudan_awareness",
        "arab_awareness",
        "islamic_awareness",
      ],
    },
  },
} as const
