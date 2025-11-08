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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_requests: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_body: Json | null
          response_status: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_requests_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      api_settings: {
        Row: {
          allowed_origins: Json | null
          api_key: string
          api_secret: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          rate_limit: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_origins?: Json | null
          api_key: string
          api_secret: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          rate_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_origins?: Json | null
          api_key?: string
          api_secret?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          rate_limit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_hotfixes: {
        Row: {
          action: string
          applied_by: string | null
          asset_path: string
          created_at: string
          id: string
          new_url: string | null
          previous_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          applied_by?: string | null
          asset_path: string
          created_at?: string
          id?: string
          new_url?: string | null
          previous_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          applied_by?: string | null
          asset_path?: string
          created_at?: string
          id?: string
          new_url?: string | null
          previous_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      booking_actions_log: {
        Row: {
          action_type: string
          booking_id: string
          created_at: string | null
          id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          booking_id: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          booking_id?: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_actions_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_paid: number | null
          booking_number: number
          check_in: string
          check_out: string
          coupon_code: string | null
          created_at: string | null
          discount_amount: number | null
          extra_meals: number | null
          guest_country_code: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_phone_hash: string | null
          guests: number
          hotel_confirmation_number: string | null
          hotel_id: string
          id: string
          manual_total: number | null
          meal_plan_extra_price: number | null
          meal_plan_max_persons: number | null
          meal_plan_name_ar: string | null
          meal_plan_name_en: string | null
          meal_plan_price: number | null
          notes: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          referrer_user_id: string | null
          rooms: number
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          booking_number?: number
          check_in: string
          check_out: string
          coupon_code?: string | null
          created_at?: string | null
          discount_amount?: number | null
          extra_meals?: number | null
          guest_country_code?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_phone_hash?: string | null
          guests?: number
          hotel_confirmation_number?: string | null
          hotel_id: string
          id?: string
          manual_total?: number | null
          meal_plan_extra_price?: number | null
          meal_plan_max_persons?: number | null
          meal_plan_name_ar?: string | null
          meal_plan_name_en?: string | null
          meal_plan_price?: number | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          referrer_user_id?: string | null
          rooms?: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          booking_number?: number
          check_in?: string
          check_out?: string
          coupon_code?: string | null
          created_at?: string | null
          discount_amount?: number | null
          extra_meals?: number | null
          guest_country_code?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_phone_hash?: string | null
          guests?: number
          hotel_confirmation_number?: string | null
          hotel_id?: string
          id?: string
          manual_total?: number | null
          meal_plan_extra_price?: number | null
          meal_plan_max_persons?: number | null
          meal_plan_name_ar?: string | null
          meal_plan_name_en?: string | null
          meal_plan_price?: number | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          referrer_user_id?: string | null
          rooms?: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_audit: {
        Row: {
          action: string
          cache_keys: string[] | null
          created_at: string | null
          details: Json | null
          id: string
          initiated_by: string | null
          purge_status: string | null
        }
        Insert: {
          action: string
          cache_keys?: string[] | null
          created_at?: string | null
          details?: Json | null
          id?: string
          initiated_by?: string | null
          purge_status?: string | null
        }
        Update: {
          action?: string
          cache_keys?: string[] | null
          created_at?: string | null
          details?: Json | null
          id?: string
          initiated_by?: string | null
          purge_status?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_admin: boolean | null
          message: string
          sender_id: string
          sender_name: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          message: string
          sender_id: string
          sender_name: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          message?: string
          sender_id?: string
          sender_name?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name_ar: string
          name_en: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name_ar: string
          name_en: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      company_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commercial_register: string
          company_name_ar: string
          company_name_en: string
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: string
          tax_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commercial_register: string
          company_name_ar: string
          company_name_en: string
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commercial_register?: string
          company_name_ar?: string
          company_name_en?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_response: string | null
          booking_id: string | null
          created_at: string | null
          description: string
          id: string
          status: Database["public"]["Enums"]["complaint_status"] | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          booking_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          status?: Database["public"]["Enums"]["complaint_status"] | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          booking_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["complaint_status"] | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_hotels: {
        Row: {
          coupon_id: string
          created_at: string | null
          hotel_id: string
          id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          hotel_id: string
          id?: string
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          hotel_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_hotels_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_hotels_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_users: {
        Row: {
          coupon_id: string
          created_at: string | null
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_users_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          applicable_to: string | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          max_uses: number | null
          min_booking_amount: number | null
          updated_at: string | null
          valid_from: string
          valid_to: string
        }
        Insert: {
          active?: boolean | null
          applicable_to?: string | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          max_uses?: number | null
          min_booking_amount?: number | null
          updated_at?: string | null
          valid_from: string
          valid_to: string
        }
        Update: {
          active?: boolean | null
          applicable_to?: string | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          min_booking_amount?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string
        }
        Relationships: []
      }
      customer_access_logs: {
        Row: {
          access_reason: string | null
          created_at: string | null
          customer_user_id: string | null
          id: string
          ip_address: string | null
          staff_user_id: string | null
        }
        Insert: {
          access_reason?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          id?: string
          ip_address?: string | null
          staff_user_id?: string | null
        }
        Update: {
          access_reason?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          id?: string
          ip_address?: string | null
          staff_user_id?: string | null
        }
        Relationships: []
      }
      deploy_snapshots: {
        Row: {
          commit_sha: string
          created_by: string | null
          deployed_at: string
          id: string
          notes: string | null
          snapshot_data: Json
          status: string
        }
        Insert: {
          commit_sha: string
          created_by?: string | null
          deployed_at?: string
          id?: string
          notes?: string | null
          snapshot_data: Json
          status?: string
        }
        Update: {
          commit_sha?: string
          created_by?: string | null
          deployed_at?: string
          id?: string
          notes?: string | null
          snapshot_data?: Json
          status?: string
        }
        Relationships: []
      }
      employee_attendance: {
        Row: {
          attendance_date: string
          check_in: string
          check_out: string | null
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_date?: string
          check_in: string
          check_out?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string
          check_in?: string
          check_out?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_salaries: {
        Row: {
          bonus: number | null
          created_at: string | null
          deductions: number | null
          employee_id: string
          id: string
          monthly_salary: number
          notes: string | null
          payment_date: string
          payment_status: string | null
          updated_at: string | null
        }
        Insert: {
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id: string
          id?: string
          monthly_salary?: number
          notes?: string | null
          payment_date: string
          payment_status?: string | null
          updated_at?: string | null
        }
        Update: {
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string
          id?: string
          monthly_salary?: number
          notes?: string | null
          payment_date?: string
          payment_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          soft_deleted: boolean | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          soft_deleted?: boolean | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          soft_deleted?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          phone_hash: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          phone_hash: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          phone_hash?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      hotel_owners: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          national_id: string | null
          notes: string | null
          owner_name_ar: string
          owner_name_en: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          national_id?: string | null
          notes?: string | null
          owner_name_ar: string
          owner_name_en: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          national_id?: string | null
          notes?: string | null
          owner_name_ar?: string
          owner_name_en?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hotel_responsible_persons: {
        Row: {
          created_at: string | null
          employee_id: string
          hotel_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          hotel_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          hotel_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_responsible_persons_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_seasonal_pricing: {
        Row: {
          created_at: string | null
          end_date: string
          hotel_id: string
          id: string
          is_available: boolean | null
          price_per_night: number
          season_name_ar: string
          season_name_en: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          hotel_id: string
          id?: string
          is_available?: boolean | null
          price_per_night: number
          season_name_ar: string
          season_name_en: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          hotel_id?: string
          id?: string
          is_available?: boolean | null
          price_per_night?: number
          season_name_ar?: string
          season_name_en?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_seasonal_pricing_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          active: boolean | null
          amenities: Json | null
          bed_type_double: string | null
          bed_type_four: string | null
          bed_type_three: string | null
          city_id: string
          commission_type: string | null
          commission_value: number | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          extra_guest_price: number
          id: string
          images: Json | null
          location: string | null
          location_url: string | null
          max_guests_per_room: number
          meal_plans: Json | null
          name_ar: string
          name_en: string
          owner_id: string | null
          pinned_to_homepage: boolean | null
          price_per_night: number
          rating: number | null
          responsible_person_id: string | null
          room_type: Database["public"]["Enums"]["room_type"] | null
          tax_percentage: number | null
          total_rooms: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          amenities?: Json | null
          bed_type_double?: string | null
          bed_type_four?: string | null
          bed_type_three?: string | null
          city_id: string
          commission_type?: string | null
          commission_value?: number | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          extra_guest_price?: number
          id?: string
          images?: Json | null
          location?: string | null
          location_url?: string | null
          max_guests_per_room?: number
          meal_plans?: Json | null
          name_ar: string
          name_en: string
          owner_id?: string | null
          pinned_to_homepage?: boolean | null
          price_per_night: number
          rating?: number | null
          responsible_person_id?: string | null
          room_type?: Database["public"]["Enums"]["room_type"] | null
          tax_percentage?: number | null
          total_rooms?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          amenities?: Json | null
          bed_type_double?: string | null
          bed_type_four?: string | null
          bed_type_three?: string | null
          city_id?: string
          commission_type?: string | null
          commission_value?: number | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          extra_guest_price?: number
          id?: string
          images?: Json | null
          location?: string | null
          location_url?: string | null
          max_guests_per_room?: number
          meal_plans?: Json | null
          name_ar?: string
          name_en?: string
          owner_id?: string | null
          pinned_to_homepage?: boolean | null
          price_per_night?: number
          rating?: number | null
          responsible_person_id?: string | null
          room_type?: Database["public"]["Enums"]["room_type"] | null
          tax_percentage?: number | null
          total_rooms?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "hotel_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_assets: {
        Row: {
          asset_data: string
          asset_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          thumbnail_url: string | null
          updated_at: string | null
          viewport_rules: Json | null
        }
        Insert: {
          asset_data: string
          asset_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string | null
          viewport_rules?: Json | null
        }
        Update: {
          asset_data?: string
          asset_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          viewport_rules?: Json | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string | null
          id: string
          points: number | null
          tier: string | null
          total_bookings: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number | null
          tier?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number | null
          tier?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      maintenance_actions: {
        Row: {
          action_type: string
          created_at: string
          finished_at: string | null
          id: string
          ip_address: string | null
          log: string | null
          payload: Json | null
          result: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          finished_at?: string | null
          id?: string
          ip_address?: string | null
          log?: string | null
          payload?: Json | null
          result: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          ip_address?: string | null
          log?: string | null
          payload?: Json | null
          result?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      maintenance_state: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          allow_admin_access: boolean
          created_at: string
          deactivated_at: string | null
          eta_minutes: number | null
          id: string
          is_active: boolean
          message: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          allow_admin_access?: boolean
          created_at?: string
          deactivated_at?: string | null
          eta_minutes?: number | null
          id?: string
          is_active?: boolean
          message?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          allow_admin_access?: boolean
          created_at?: string
          deactivated_at?: string | null
          eta_minutes?: number | null
          id?: string
          is_active?: boolean
          message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_settings: {
        Row: {
          bank_account_number: string | null
          bank_details_y: number | null
          bank_location: string | null
          bank_name: string | null
          booking_number_x: number | null
          booking_number_y: number | null
          booking_table_y: number | null
          cancellation_policy_ar: string | null
          cancellation_policy_en: string | null
          client_info_y: number | null
          company_cr: string | null
          company_description_ar: string | null
          company_description_en: string | null
          company_license: string | null
          company_logo_url: string | null
          company_vat: string | null
          contact_numbers: Json | null
          created_at: string | null
          font_size_body: number | null
          font_size_header: number | null
          font_size_small: number | null
          font_size_title: number | null
          footer_bg_color: string | null
          footer_company_name_ar: string | null
          footer_company_name_en: string | null
          footer_height: number | null
          footer_logo_svg_ar: string | null
          footer_logo_svg_en: string | null
          header_bg_color: string | null
          header_height: number | null
          header_logo_svg_ar: string | null
          header_logo_svg_en: string | null
          header_text_ar: string | null
          header_text_en: string | null
          hotel_confirmation_border_color: string | null
          hotel_confirmation_border_width: number | null
          hotel_confirmation_box_border_radius: number | null
          hotel_confirmation_box_height: number | null
          hotel_confirmation_box_padding: number | null
          hotel_confirmation_box_width: number | null
          hotel_confirmation_box_x: number | null
          hotel_confirmation_box_y: number | null
          hotel_confirmation_font_family: string | null
          hotel_confirmation_font_size: number | null
          hotel_confirmation_text_color: string | null
          iban: string | null
          id: string
          line_height: number | null
          logo_height: number | null
          logo_position_x: number | null
          logo_position_y: number | null
          logo_width: number | null
          page_margin_left: number | null
          page_margin_right: number | null
          price_section_y: number | null
          primary_color: string | null
          primary_font: string | null
          responsible_persons: Json | null
          secondary_color: string | null
          secondary_font: string | null
          section_spacing: number | null
          show_bank_details: boolean | null
          show_company_description: boolean | null
          show_footer_info: boolean | null
          show_logo: boolean | null
          show_responsible_persons: boolean | null
          show_terms: boolean | null
          terms_ar: string | null
          terms_en: string | null
          terms_y: number | null
          text_color: string | null
          title_y: number | null
          updated_at: string | null
        }
        Insert: {
          bank_account_number?: string | null
          bank_details_y?: number | null
          bank_location?: string | null
          bank_name?: string | null
          booking_number_x?: number | null
          booking_number_y?: number | null
          booking_table_y?: number | null
          cancellation_policy_ar?: string | null
          cancellation_policy_en?: string | null
          client_info_y?: number | null
          company_cr?: string | null
          company_description_ar?: string | null
          company_description_en?: string | null
          company_license?: string | null
          company_logo_url?: string | null
          company_vat?: string | null
          contact_numbers?: Json | null
          created_at?: string | null
          font_size_body?: number | null
          font_size_header?: number | null
          font_size_small?: number | null
          font_size_title?: number | null
          footer_bg_color?: string | null
          footer_company_name_ar?: string | null
          footer_company_name_en?: string | null
          footer_height?: number | null
          footer_logo_svg_ar?: string | null
          footer_logo_svg_en?: string | null
          header_bg_color?: string | null
          header_height?: number | null
          header_logo_svg_ar?: string | null
          header_logo_svg_en?: string | null
          header_text_ar?: string | null
          header_text_en?: string | null
          hotel_confirmation_border_color?: string | null
          hotel_confirmation_border_width?: number | null
          hotel_confirmation_box_border_radius?: number | null
          hotel_confirmation_box_height?: number | null
          hotel_confirmation_box_padding?: number | null
          hotel_confirmation_box_width?: number | null
          hotel_confirmation_box_x?: number | null
          hotel_confirmation_box_y?: number | null
          hotel_confirmation_font_family?: string | null
          hotel_confirmation_font_size?: number | null
          hotel_confirmation_text_color?: string | null
          iban?: string | null
          id?: string
          line_height?: number | null
          logo_height?: number | null
          logo_position_x?: number | null
          logo_position_y?: number | null
          logo_width?: number | null
          page_margin_left?: number | null
          page_margin_right?: number | null
          price_section_y?: number | null
          primary_color?: string | null
          primary_font?: string | null
          responsible_persons?: Json | null
          secondary_color?: string | null
          secondary_font?: string | null
          section_spacing?: number | null
          show_bank_details?: boolean | null
          show_company_description?: boolean | null
          show_footer_info?: boolean | null
          show_logo?: boolean | null
          show_responsible_persons?: boolean | null
          show_terms?: boolean | null
          terms_ar?: string | null
          terms_en?: string | null
          terms_y?: number | null
          text_color?: string | null
          title_y?: number | null
          updated_at?: string | null
        }
        Update: {
          bank_account_number?: string | null
          bank_details_y?: number | null
          bank_location?: string | null
          bank_name?: string | null
          booking_number_x?: number | null
          booking_number_y?: number | null
          booking_table_y?: number | null
          cancellation_policy_ar?: string | null
          cancellation_policy_en?: string | null
          client_info_y?: number | null
          company_cr?: string | null
          company_description_ar?: string | null
          company_description_en?: string | null
          company_license?: string | null
          company_logo_url?: string | null
          company_vat?: string | null
          contact_numbers?: Json | null
          created_at?: string | null
          font_size_body?: number | null
          font_size_header?: number | null
          font_size_small?: number | null
          font_size_title?: number | null
          footer_bg_color?: string | null
          footer_company_name_ar?: string | null
          footer_company_name_en?: string | null
          footer_height?: number | null
          footer_logo_svg_ar?: string | null
          footer_logo_svg_en?: string | null
          header_bg_color?: string | null
          header_height?: number | null
          header_logo_svg_ar?: string | null
          header_logo_svg_en?: string | null
          header_text_ar?: string | null
          header_text_en?: string | null
          hotel_confirmation_border_color?: string | null
          hotel_confirmation_border_width?: number | null
          hotel_confirmation_box_border_radius?: number | null
          hotel_confirmation_box_height?: number | null
          hotel_confirmation_box_padding?: number | null
          hotel_confirmation_box_width?: number | null
          hotel_confirmation_box_x?: number | null
          hotel_confirmation_box_y?: number | null
          hotel_confirmation_font_family?: string | null
          hotel_confirmation_font_size?: number | null
          hotel_confirmation_text_color?: string | null
          iban?: string | null
          id?: string
          line_height?: number | null
          logo_height?: number | null
          logo_position_x?: number | null
          logo_position_y?: number | null
          logo_width?: number | null
          page_margin_left?: number | null
          page_margin_right?: number | null
          price_section_y?: number | null
          primary_color?: string | null
          primary_font?: string | null
          responsible_persons?: Json | null
          secondary_color?: string | null
          secondary_font?: string | null
          section_spacing?: number | null
          show_bank_details?: boolean | null
          show_company_description?: boolean | null
          show_footer_info?: boolean | null
          show_logo?: boolean | null
          show_responsible_persons?: boolean | null
          show_terms?: boolean | null
          terms_ar?: string | null
          terms_en?: string | null
          terms_y?: number | null
          text_color?: string | null
          title_y?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      private_account_access: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      private_hotels: {
        Row: {
          active: boolean | null
          city: string | null
          created_at: string | null
          id: string
          is_contract: boolean | null
          is_temporary: boolean | null
          location: string | null
          name_ar: string
          name_en: string
          notes: string | null
          owner_id: string | null
          price_per_night: number | null
          total_rooms: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_contract?: boolean | null
          is_temporary?: boolean | null
          location?: string | null
          name_ar: string
          name_en: string
          notes?: string | null
          owner_id?: string | null
          price_per_night?: number | null
          total_rooms?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_contract?: boolean | null
          is_temporary?: boolean | null
          location?: string | null
          name_ar?: string
          name_en?: string
          notes?: string | null
          owner_id?: string | null
          price_per_night?: number | null
          total_rooms?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_hotels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "private_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      private_owners: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_contract: boolean | null
          is_temporary: boolean | null
          name_ar: string
          name_en: string
          national_id: string | null
          notes: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_contract?: boolean | null
          is_temporary?: boolean | null
          name_ar: string
          name_en: string
          national_id?: string | null
          notes?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_contract?: boolean | null
          is_temporary?: boolean | null
          name_ar?: string
          name_en?: string
          national_id?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      private_rooms: {
        Row: {
          created_at: string | null
          hotel_id: string
          id: string
          notes: string | null
          price_per_night: number | null
          room_number: string
          room_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hotel_id: string
          id?: string
          notes?: string | null
          price_per_night?: number | null
          room_number: string
          room_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hotel_id?: string
          id?: string
          notes?: string | null
          price_per_night?: number | null
          room_number?: string
          room_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "private_hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      private_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          hotel_id: string | null
          id: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hotel_id?: string | null
          id?: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hotel_id?: string | null
          id?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_transactions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "private_hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      private_vault: {
        Row: {
          amount: number | null
          id: string
          last_updated: string | null
          updated_by: string | null
        }
        Insert: {
          amount?: number | null
          id?: string
          last_updated?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number | null
          id?: string
          last_updated?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          commission_percentage: number | null
          created_at: string | null
          force_theme: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          referral_code: string | null
          referred_by: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          commission_percentage?: number | null
          created_at?: string | null
          force_theme?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferences?: Json | null
          referral_code?: string | null
          referred_by?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_percentage?: number | null
          created_at?: string | null
          force_theme?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          referral_code?: string | null
          referred_by?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_earned: number | null
          created_at: string | null
          id: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          status: string | null
          total_bookings: number | null
          updated_at: string | null
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          status?: string | null
          total_bookings?: number | null
          updated_at?: string | null
        }
        Update: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string | null
          total_bookings?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_response: string | null
          booking_id: string
          comment: string | null
          created_at: string | null
          guest_name: string | null
          guest_phone: string | null
          hotel_id: string
          id: string
          rating: number
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          booking_id: string
          comment?: string | null
          created_at?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          hotel_id: string
          id?: string
          rating: number
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          hotel_id?: string
          id?: string
          rating?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      room_availability: {
        Row: {
          booking_id: string
          check_in: string
          check_out: string
          created_at: string | null
          hotel_id: string
          id: string
          rooms_booked: number
        }
        Insert: {
          booking_id: string
          check_in: string
          check_out: string
          created_at?: string | null
          hotel_id: string
          id?: string
          rooms_booked?: number
        }
        Update: {
          booking_id?: string
          check_in?: string
          check_out?: string
          created_at?: string | null
          hotel_id?: string
          id?: string
          rooms_booked?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_availability_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          admin_theme: string | null
          animation_speed_multiplier: number
          backup_created_at: string | null
          backup_data: Json | null
          backup_version: number | null
          chat_widget_code: string | null
          created_at: string | null
          custom_body_code: string | null
          custom_head_code: string | null
          disable_animations: boolean
          email: string | null
          facebook_url: string | null
          hotel_room_color: string | null
          id: string
          instagram_url: string | null
          loader_custom_css: string | null
          loader_custom_html: string | null
          loader_custom_js: string | null
          loader_enabled: boolean
          loader_speed_ms: number
          loader_type: string
          meal_badge_auto_width_desktop: boolean | null
          meal_badge_auto_width_mobile: boolean | null
          meal_badge_auto_width_tablet: boolean | null
          meal_badge_border_radius: number | null
          meal_badge_color: string | null
          meal_badge_font_size: number | null
          meal_badge_height: number | null
          meal_badge_height_desktop: number | null
          meal_badge_height_mobile: number | null
          meal_badge_height_tablet: number | null
          meal_badge_text_color: string | null
          meal_badge_width: number | null
          meal_badge_width_desktop: number | null
          meal_badge_width_mobile: number | null
          meal_badge_width_tablet: number | null
          meal_description_bg_color: string | null
          meal_description_border_color: string | null
          meal_description_border_radius: number | null
          meal_description_font_size: number | null
          meal_description_text_color: string | null
          owner_room_color: string | null
          phone: string | null
          task_visible_roles: Json | null
          tax_percentage: number
          tidio_client_id: string | null
          tidio_client_secret: string | null
          tidio_private_key: string | null
          tidio_public_key: string | null
          tidio_widget_code: string | null
          twitter_url: string | null
          updated_at: string | null
          user_theme: string | null
          whatsapp_number: string | null
        }
        Insert: {
          admin_theme?: string | null
          animation_speed_multiplier?: number
          backup_created_at?: string | null
          backup_data?: Json | null
          backup_version?: number | null
          chat_widget_code?: string | null
          created_at?: string | null
          custom_body_code?: string | null
          custom_head_code?: string | null
          disable_animations?: boolean
          email?: string | null
          facebook_url?: string | null
          hotel_room_color?: string | null
          id?: string
          instagram_url?: string | null
          loader_custom_css?: string | null
          loader_custom_html?: string | null
          loader_custom_js?: string | null
          loader_enabled?: boolean
          loader_speed_ms?: number
          loader_type?: string
          meal_badge_auto_width_desktop?: boolean | null
          meal_badge_auto_width_mobile?: boolean | null
          meal_badge_auto_width_tablet?: boolean | null
          meal_badge_border_radius?: number | null
          meal_badge_color?: string | null
          meal_badge_font_size?: number | null
          meal_badge_height?: number | null
          meal_badge_height_desktop?: number | null
          meal_badge_height_mobile?: number | null
          meal_badge_height_tablet?: number | null
          meal_badge_text_color?: string | null
          meal_badge_width?: number | null
          meal_badge_width_desktop?: number | null
          meal_badge_width_mobile?: number | null
          meal_badge_width_tablet?: number | null
          meal_description_bg_color?: string | null
          meal_description_border_color?: string | null
          meal_description_border_radius?: number | null
          meal_description_font_size?: number | null
          meal_description_text_color?: string | null
          owner_room_color?: string | null
          phone?: string | null
          task_visible_roles?: Json | null
          tax_percentage?: number
          tidio_client_id?: string | null
          tidio_client_secret?: string | null
          tidio_private_key?: string | null
          tidio_public_key?: string | null
          tidio_widget_code?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_theme?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          admin_theme?: string | null
          animation_speed_multiplier?: number
          backup_created_at?: string | null
          backup_data?: Json | null
          backup_version?: number | null
          chat_widget_code?: string | null
          created_at?: string | null
          custom_body_code?: string | null
          custom_head_code?: string | null
          disable_animations?: boolean
          email?: string | null
          facebook_url?: string | null
          hotel_room_color?: string | null
          id?: string
          instagram_url?: string | null
          loader_custom_css?: string | null
          loader_custom_html?: string | null
          loader_custom_js?: string | null
          loader_enabled?: boolean
          loader_speed_ms?: number
          loader_type?: string
          meal_badge_auto_width_desktop?: boolean | null
          meal_badge_auto_width_mobile?: boolean | null
          meal_badge_auto_width_tablet?: boolean | null
          meal_badge_border_radius?: number | null
          meal_badge_color?: string | null
          meal_badge_font_size?: number | null
          meal_badge_height?: number | null
          meal_badge_height_desktop?: number | null
          meal_badge_height_mobile?: number | null
          meal_badge_height_tablet?: number | null
          meal_badge_text_color?: string | null
          meal_badge_width?: number | null
          meal_badge_width_desktop?: number | null
          meal_badge_width_mobile?: number | null
          meal_badge_width_tablet?: number | null
          meal_description_bg_color?: string | null
          meal_description_border_color?: string | null
          meal_description_border_radius?: number | null
          meal_description_font_size?: number | null
          meal_description_text_color?: string | null
          owner_room_color?: string | null
          phone?: string | null
          task_visible_roles?: Json | null
          tax_percentage?: number
          tidio_client_id?: string | null
          tidio_client_secret?: string | null
          tidio_private_key?: string | null
          tidio_public_key?: string | null
          tidio_widget_code?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_theme?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      task_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_basic_access_users: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      task_categories: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_full_access_users: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      task_settings: {
        Row: {
          color_scheme: Json | null
          created_at: string | null
          drag_speed: number | null
          id: string
          show_animations: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color_scheme?: Json | null
          created_at?: string | null
          drag_speed?: number | null
          id?: string
          show_animations?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color_scheme?: Json | null
          created_at?: string | null
          drag_speed?: number | null
          id?: string
          show_animations?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_sharing_settings: {
        Row: {
          created_at: string
          id: string
          notify_on_create: boolean | null
          notify_on_status_change: boolean | null
          notify_on_update: boolean | null
          share_via_email: boolean | null
          share_via_whatsapp: boolean | null
          share_via_whatsapp_group: boolean | null
          updated_at: string
          whatsapp_group_link: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_create?: boolean | null
          notify_on_status_change?: boolean | null
          notify_on_update?: boolean | null
          share_via_email?: boolean | null
          share_via_whatsapp?: boolean | null
          share_via_whatsapp_group?: boolean | null
          updated_at?: string
          whatsapp_group_link?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_create?: boolean | null
          notify_on_status_change?: boolean | null
          notify_on_update?: boolean | null
          share_via_email?: boolean | null
          share_via_whatsapp?: boolean | null
          share_via_whatsapp_group?: boolean | null
          updated_at?: string
          whatsapp_group_link?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          amount_paid: number | null
          amount_remaining: number | null
          amount_total: number | null
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          financial_amount: number | null
          id: string
          is_financial: boolean | null
          order_index: number | null
          payment_due_date: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string | null
          vault_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_remaining?: number | null
          amount_total?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          financial_amount?: number | null
          id?: string
          is_financial?: boolean | null
          order_index?: number | null
          payment_due_date?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string | null
          vault_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_remaining?: number | null
          amount_total?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          financial_amount?: number | null
          id?: string
          is_financial?: boolean | null
          order_index?: number | null
          payment_due_date?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string | null
          vault_id?: string | null
        }
        Relationships: []
      }
      theme_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          theme_data: Json
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          theme_data: Json
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          theme_data?: Json
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      upload_audit: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          status: string
          upload_target: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          status: string
          upload_target: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          status?: string
          upload_target?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_guests: {
        Row: {
          created_at: string | null
          guest_country_code: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guest_country_code?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          guest_country_code?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          created_at: string | null
          group_link: string | null
          id: string
          no_booking_alert_hours: number | null
          reminder_hours: number | null
          send_confirmation: boolean | null
          send_reminder: boolean | null
          send_to_group: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_link?: string | null
          id?: string
          no_booking_alert_hours?: number | null
          reminder_hours?: number | null
          send_confirmation?: boolean | null
          send_reminder?: boolean | null
          send_to_group?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_link?: string | null
          id?: string
          no_booking_alert_hours?: number | null
          reminder_hours?: number | null
          send_confirmation?: boolean | null
          send_reminder?: boolean | null
          send_to_group?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_referral_commission: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      check_room_availability: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_hotel_id: string
          p_rooms_needed: number
        }
        Returns: boolean
      }
      create_system_backup: { Args: never; Returns: undefined }
      employee_has_assigned_customer: {
        Args: { customer_id: string; employee_id: string }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
      get_available_rooms_count: {
        Args: { p_check_in: string; p_check_out: string; p_hotel_id: string }
        Returns: number
      }
      get_guest_bookings: {
        Args: { p_phone: string }
        Returns: {
          amount_paid: number
          booking_number: number
          check_in: string
          check_out: string
          discount_amount: number
          guest_name: string
          guest_phone: string
          guests: number
          hotel_confirmation_number: string
          hotel_location: string
          hotel_location_url: string
          hotel_max_guests_per_room: number
          hotel_name_ar: string
          hotel_name_en: string
          hotel_price_per_night: number
          hotel_room_type: Database["public"]["Enums"]["room_type"]
          hotel_tax_percentage: number
          id: string
          manual_total: number
          notes: string
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          rooms: number
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          user_id: string
        }[]
      }
      get_hotel_contacts: {
        Args: { p_hotel_id: string }
        Returns: {
          contact_person: string
          contact_phone: string
        }[]
      }
      get_hotel_price_for_date: {
        Args: { p_check_in_date: string; p_hotel_id: string }
        Returns: number
      }
      get_profile_with_audit: {
        Args: { p_access_reason?: string; p_profile_id: string }
        Returns: {
          commission_percentage: number
          created_at: string
          full_name: string
          id: string
          phone: string
          referral_code: string
          referred_by: string
          updated_at: string
        }[]
      }
      get_public_hotel: {
        Args: { p_hotel_id: string }
        Returns: {
          active: boolean
          amenities: Json
          bed_type_double: string
          city_id: string
          city_name_ar: string
          city_name_en: string
          created_at: string
          description_ar: string
          description_en: string
          extra_guest_price: number
          id: string
          images: Json
          location: string
          location_url: string
          max_guests_per_room: number
          meal_plans: Json
          name_ar: string
          name_en: string
          price_per_night: number
          rating: number
          room_type: Database["public"]["Enums"]["room_type"]
          tax_percentage: number
          total_rooms: number
          updated_at: string
        }[]
      }
      get_public_hotels: {
        Args: { p_active_only?: boolean; p_city_id?: string }
        Returns: {
          active: boolean
          amenities: Json
          bed_type_double: string
          city_id: string
          city_name_ar: string
          city_name_en: string
          created_at: string
          description_ar: string
          description_en: string
          extra_guest_price: number
          id: string
          images: Json
          location: string
          location_url: string
          max_guests_per_room: number
          meal_plans: Json
          name_ar: string
          name_en: string
          price_per_night: number
          rating: number
          room_type: Database["public"]["Enums"]["room_type"]
          tax_percentage: number
          total_rooms: number
          updated_at: string
        }[]
      }
      get_public_site_settings: {
        Args: never
        Returns: {
          email: string
          facebook_url: string
          hotel_room_color: string
          instagram_url: string
          owner_room_color: string
          phone: string
          twitter_url: string
          whatsapp_number: string
        }[]
      }
      get_site_settings: {
        Args: never
        Returns: {
          email: string
          facebook_url: string
          hotel_room_color: string
          instagram_url: string
          owner_room_color: string
          phone: string
          tax_percentage: number
          twitter_url: string
          whatsapp_number: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "manager"
        | "assistantmanager"
        | "staff"
        | "visamanager"
        | "visaemployee"
        | "accountsmanager"
        | "accountsemployee"
        | "marketingstaff"
        | "client"
        | "company"
        | "admin"
        | "employee"
        | "customer"
        | "assistant_manager"
        | "specific_financial_manager"
        | "specific_financial_employee"
        | "visa_manager"
        | "visa_employee"
      booking_status: "new" | "pending" | "confirmed" | "cancelled" | "rejected"
      complaint_status: "new" | "pending" | "rejected" | "resolved"
      meal_plan_type:
        | "breakfast_only"
        | "half_board"
        | "full_board"
        | "all_inclusive"
        | "no_meals"
      payment_status: "paid" | "partially_paid" | "unpaid"
      room_type: "hotel_rooms" | "owner_rooms"
      task_category:
        | "general"
        | "financial"
        | "booking"
        | "support"
        | "maintenance"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "new"
        | "pending"
        | "delegated"
        | "confirmed"
        | "approved"
        | "todo"
        | "in_progress"
        | "done"
        | "rejected"
        | "archived"
      task_type:
        | "financial"
        | "administrative"
        | "scheduling"
        | "receipt_voucher"
        | "payment_voucher"
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
      app_role: [
        "manager",
        "assistantmanager",
        "staff",
        "visamanager",
        "visaemployee",
        "accountsmanager",
        "accountsemployee",
        "marketingstaff",
        "client",
        "company",
        "admin",
        "employee",
        "customer",
        "assistant_manager",
        "specific_financial_manager",
        "specific_financial_employee",
        "visa_manager",
        "visa_employee",
      ],
      booking_status: ["new", "pending", "confirmed", "cancelled", "rejected"],
      complaint_status: ["new", "pending", "rejected", "resolved"],
      meal_plan_type: [
        "breakfast_only",
        "half_board",
        "full_board",
        "all_inclusive",
        "no_meals",
      ],
      payment_status: ["paid", "partially_paid", "unpaid"],
      room_type: ["hotel_rooms", "owner_rooms"],
      task_category: [
        "general",
        "financial",
        "booking",
        "support",
        "maintenance",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "new",
        "pending",
        "delegated",
        "confirmed",
        "approved",
        "todo",
        "in_progress",
        "done",
        "rejected",
        "archived",
      ],
      task_type: [
        "financial",
        "administrative",
        "scheduling",
        "receipt_voucher",
        "payment_voucher",
      ],
    },
  },
} as const
