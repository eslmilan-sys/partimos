// GENERADO — no editar a mano.
// Origen: proyecto Supabase Partimos (zcwueglgirqxwazhfidi), esquema public.
// Regenerar con:  supabase gen types typescript --project-id zcwueglgirqxwazhfidi
// Esta es la forma real de las tablas. Los datos simulados de servicios/_fuente/simulado
// se declaran contra estos tipos, así que si una columna cambia, el simulado deja de compilar.

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          boarding_code: string | null
          arrival_code: string | null
          boarded_at: string | null
          released_at: string | null
          expires_at: string | null
          detour_minutes: number | null
          mochilas: number
          maletas: number
          alight_sequence: number | null
          board_sequence: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          offer_accepted: boolean | null
          offer_price_cents: number | null
          passenger_id: string
          payment_channel: Database["public"]["Enums"]["payment_channel"]
          proposal_accepted: boolean | null
          proposed_point: string | null
          seats: number
          service_fee_cents: number
          status: Database["public"]["Enums"]["booking_status"]
          total_cents: number
          trip_id: string
          trip_stop_id: string | null
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          boarding_code?: string | null
          arrival_code?: string | null
          boarded_at?: string | null
          released_at?: string | null
          expires_at?: string | null
          detour_minutes?: number | null
          mochilas?: number
          maletas?: number
          alight_sequence?: number | null
          board_sequence?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          offer_accepted?: boolean | null
          offer_price_cents?: number | null
          passenger_id: string
          payment_channel?: Database["public"]["Enums"]["payment_channel"]
          proposal_accepted?: boolean | null
          proposed_point?: string | null
          seats: number
          service_fee_cents?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_cents: number
          trip_id: string
          trip_stop_id?: string | null
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          boarding_code?: string | null
          arrival_code?: string | null
          boarded_at?: string | null
          released_at?: string | null
          expires_at?: string | null
          detour_minutes?: number | null
          mochilas?: number
          maletas?: number
          alight_sequence?: number | null
          board_sequence?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          offer_accepted?: boolean | null
          offer_price_cents?: number | null
          passenger_id?: string
          payment_channel?: Database["public"]["Enums"]["payment_channel"]
          proposal_accepted?: boolean | null
          proposed_point?: string | null
          seats?: number
          service_fee_cents?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_cents?: number
          trip_id?: string
          trip_stop_id?: string | null
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "available_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_stop_id_fkey"
            columns: ["trip_stop_id"]
            isOneToOne: false
            referencedRelation: "trip_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policies: {
        Row: {
          country_code: string
          created_at: string
          driver_goodwill_hours: number
          driver_goodwill_pct: number
          driver_suspend_count: number
          driver_suspend_window_days: number
          effective_from: string
          effective_to: string | null
          free_cancels_count: number
          free_cancels_window_days: number
          full_refund_hours: number
          id: string
          late_retain_pct: number
          no_show_wait_minutes: number
          partial_refund_hours: number
          version_label: string
        }
        Insert: {
          country_code: string
          created_at?: string
          driver_goodwill_hours?: number
          driver_goodwill_pct?: number
          driver_suspend_count?: number
          driver_suspend_window_days?: number
          effective_from: string
          effective_to?: string | null
          free_cancels_count?: number
          free_cancels_window_days?: number
          full_refund_hours?: number
          id?: string
          late_retain_pct?: number
          no_show_wait_minutes?: number
          partial_refund_hours?: number
          version_label: string
        }
        Update: {
          country_code?: string
          created_at?: string
          driver_goodwill_hours?: number
          driver_goodwill_pct?: number
          driver_suspend_count?: number
          driver_suspend_window_days?: number
          effective_from?: string
          effective_to?: string | null
          free_cancels_count?: number
          free_cancels_window_days?: number
          full_refund_hours?: number
          id?: string
          late_retain_pct?: number
          no_show_wait_minutes?: number
          partial_refund_hours?: number
          version_label?: string
        }
        Relationships: []
      }
      cancellations: {
        Row: {
          actor_id: string | null
          booking_id: string | null
          cancelled_by: Database["public"]["Enums"]["cancel_party"]
          created_at: string
          hours_before: number
          id: string
          policy_id: string
          reason_code: string | null
          reason_free_text: string | null
          resolved_at: string | null
          seat_resold: boolean
          snap_goodwill_cents: number
          snap_refund_cents: number
          snap_retained_cents: number
          snap_total_cents: number
          trip_id: string | null
          was_free_cancel: boolean
        }
        Insert: {
          actor_id?: string | null
          booking_id?: string | null
          cancelled_by: Database["public"]["Enums"]["cancel_party"]
          created_at?: string
          hours_before: number
          id?: string
          policy_id: string
          reason_code?: string | null
          reason_free_text?: string | null
          resolved_at?: string | null
          seat_resold?: boolean
          snap_goodwill_cents?: number
          snap_refund_cents: number
          snap_retained_cents: number
          snap_total_cents: number
          trip_id?: string | null
          was_free_cancel?: boolean
        }
        Update: {
          actor_id?: string | null
          booking_id?: string | null
          cancelled_by?: Database["public"]["Enums"]["cancel_party"]
          created_at?: string
          hours_before?: number
          id?: string
          policy_id?: string
          reason_code?: string | null
          reason_free_text?: string | null
          resolved_at?: string | null
          seat_resold?: boolean
          snap_goodwill_cents?: number
          snap_refund_cents?: number
          snap_retained_cents?: number
          snap_total_cents?: number
          trip_id?: string | null
          was_free_cancel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cancellations_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "available_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          province: string | null
          slug: string
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          province?: string | null
          slug: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          province?: string | null
          slug?: string
        }
        Relationships: []
      }
      corridors: {
        Row: {
          max_price_cents: number | null
          bus_price_cents: number | null
          created_at: string
          destination_city_id: string
          distance_km: number
          id: string
          is_active: boolean
          is_priority: boolean
          origin_city_id: string
          slug: string
          toll_cents: number
          typical_duration_min: number | null
        }
        Insert: {
          max_price_cents?: number | null
          bus_price_cents?: number | null
          created_at?: string
          destination_city_id: string
          distance_km: number
          id?: string
          is_active?: boolean
          is_priority?: boolean
          origin_city_id: string
          slug: string
          toll_cents?: number
          typical_duration_min?: number | null
        }
        Update: {
          max_price_cents?: number | null
          bus_price_cents?: number | null
          created_at?: string
          destination_city_id?: string
          distance_km?: number
          id?: string
          is_active?: boolean
          is_priority?: boolean
          origin_city_id?: string
          slug?: string
          toll_cents?: number
          typical_duration_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "corridors_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corridors_origin_city_id_fkey"
            columns: ["origin_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          amount_cents: number
          cancellation_id: string | null
          consumed_booking_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          origin: string
          profile_id: string
        }
        Insert: {
          amount_cents: number
          cancellation_id?: string | null
          consumed_booking_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          origin: string
          profile_id: string
        }
        Update: {
          amount_cents?: number
          cancellation_id?: string | null
          consumed_booking_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          origin?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_cancellation_id_fkey"
            columns: ["cancellation_id"]
            isOneToOne: false
            referencedRelation: "cancellations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_consumed_booking_id_fkey"
            columns: ["consumed_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_signals: {
        Row: {
          converted_booking_id: string | null
          corridor_id: string | null
          created_at: string
          destination_city_id: string | null
          id: string
          notified_drivers: number
          origin_city_id: string | null
          requested_date: string
          results_count: number
          search_session: string | null
          searcher_id: string | null
          seats_wanted: number
          source: string | null
        }
        Insert: {
          converted_booking_id?: string | null
          corridor_id?: string | null
          created_at?: string
          destination_city_id?: string | null
          id?: string
          notified_drivers?: number
          origin_city_id?: string | null
          requested_date: string
          results_count?: number
          search_session?: string | null
          searcher_id?: string | null
          seats_wanted?: number
          source?: string | null
        }
        Update: {
          converted_booking_id?: string | null
          corridor_id?: string | null
          created_at?: string
          destination_city_id?: string | null
          id?: string
          notified_drivers?: number
          origin_city_id?: string | null
          requested_date?: string
          results_count?: number
          search_session?: string | null
          searcher_id?: string | null
          seats_wanted?: number
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_signals_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_signals_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_signals_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_signals_origin_city_id_fkey"
            columns: ["origin_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_signals_searcher_id_fkey"
            columns: ["searcher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_signals_searcher_id_fkey"
            columns: ["searcher_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_activation: {
        Row: {
          acquisition_cost_cents: number | null
          acquisition_source: string | null
          first_trip_completed_at: string | null
          first_trip_published_at: string | null
          profile_id: string
          signed_up_at: string
          trips_published_count: number
        }
        Insert: {
          acquisition_cost_cents?: number | null
          acquisition_source?: string | null
          first_trip_completed_at?: string | null
          first_trip_published_at?: string | null
          profile_id: string
          signed_up_at: string
          trips_published_count?: number
        }
        Update: {
          acquisition_cost_cents?: number | null
          acquisition_source?: string | null
          first_trip_completed_at?: string | null
          first_trip_published_at?: string | null
          profile_id?: string
          signed_up_at?: string
          trips_published_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "driver_activation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_activation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          destination_slug: string | null
          device: string | null
          id: number
          name: string
          occurred_at: string
          origin_slug: string | null
          path: string | null
          props: Json
          referrer_host: string | null
          session_id: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          destination_slug?: string | null
          device?: string | null
          id?: number
          name: string
          occurred_at?: string
          origin_slug?: string | null
          path?: string | null
          props?: Json
          referrer_host?: string | null
          session_id: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          destination_slug?: string | null
          device?: string | null
          id?: number
          name?: string
          occurred_at?: string
          origin_slug?: string | null
          path?: string | null
          props?: Json
          referrer_host?: string | null
          session_id?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "metricas_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          created_at: string
          document_country: string | null
          document_type: string | null
          expires_at: string | null
          id: string
          profile_id: string
          provider: string
          provider_ref: string
          score: number | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_country?: string | null
          document_type?: string | null
          expires_at?: string | null
          id?: string
          profile_id: string
          provider: string
          provider_ref: string
          score?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_country?: string | null
          document_type?: string | null
          expires_at?: string | null
          id?: string
          profile_id?: string
          provider?: string
          provider_ref?: string
          score?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          booking_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          reporter_id: string | null
          resolution: string | null
          resolved_at: string | null
          severity: number
          subject_id: string | null
        }
        Insert: {
          booking_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity: number
          subject_id?: string | null
        }
        Update: {
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: number
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account: Database["public"]["Enums"]["ledger_account"]
          amount_cents: number
          booking_id: string | null
          created_at: string
          currency: string
          description: string
          entry_group: string
          id: number
          occurred_at: string
          payment_id: string | null
          payout_id: string | null
          profile_id: string | null
        }
        Insert: {
          account: Database["public"]["Enums"]["ledger_account"]
          amount_cents: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description: string
          entry_group: string
          id?: number
          occurred_at?: string
          payment_id?: string | null
          payout_id?: string | null
          profile_id?: string | null
        }
        Update: {
          account?: Database["public"]["Enums"]["ledger_account"]
          amount_cents?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          entry_group?: string
          id?: number
          occurred_at?: string
          payment_id?: string | null
          payout_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: number
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: number
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: number
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      no_show_reports: {
        Row: {
          booking_id: string
          created_at: string
          disputed: boolean
          id: string
          reported_by: Database["public"]["Enums"]["cancel_party"]
          reporter_id: string
          reporter_lat: number | null
          reporter_lng: number | null
          resolution: string | null
          resolved_at: string | null
          waited_minutes: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          disputed?: boolean
          id?: string
          reported_by: Database["public"]["Enums"]["cancel_party"]
          reporter_id: string
          reporter_lat?: number | null
          reporter_lng?: number | null
          resolution?: string | null
          resolved_at?: string | null
          waited_minutes?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          disputed?: boolean
          id?: string
          reported_by?: Database["public"]["Enums"]["cancel_party"]
          reporter_id?: string
          reporter_lat?: number | null
          reporter_lng?: number | null
          resolution?: string | null
          resolved_at?: string | null
          waited_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "no_show_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "no_show_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "no_show_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          booking_id: string
          captured_at: string | null
          created_at: string
          fee_cents: number
          id: string
          provider: string
          provider_order_id: string | null
          provider_ref: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_cents: number
          booking_id: string
          captured_at?: string | null
          created_at?: string
          fee_cents?: number
          id?: string
          provider?: string
          provider_order_id?: string | null
          provider_ref?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          captured_at?: string | null
          created_at?: string
          fee_cents?: number
          id?: string
          provider?: string
          provider_order_id?: string | null
          provider_ref?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          created_at: string
          executed_at: string | null
          executed_by: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payout_batches_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batches_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          batch_id: string | null
          created_at: string
          driver_id: string
          id: string
          method: string
          provider_ref: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount_cents: number
          batch_id?: string | null
          created_at?: string
          driver_id: string
          id?: string
          method?: string
          provider_ref?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount_cents?: number
          batch_id?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          method?: string
          provider_ref?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payouts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_points: {
        Row: {
          city_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_terminal: boolean
          lat: number | null
          lng: number | null
          name: string
          proposals_count: number
        }
        Insert: {
          city_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_terminal?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          proposals_count?: number
        }
        Update: {
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_terminal?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          proposals_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pickup_points_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          city_slug: string
          country_code: string
          created_at: string
          geom: unknown
          id: number
          is_public: boolean
          kind: string | null
          name: string
          source: Database["public"]["Enums"]["place_source"]
          source_id: string | null
          used_count: number
        }
        Insert: {
          address?: string | null
          city_slug: string
          country_code?: string
          created_at?: string
          geom: unknown
          id?: number
          is_public?: boolean
          kind?: string | null
          name: string
          source: Database["public"]["Enums"]["place_source"]
          source_id?: string | null
          used_count?: number
        }
        Update: {
          address?: string | null
          city_slug?: string
          country_code?: string
          created_at?: string
          geom?: unknown
          id?: number
          is_public?: boolean
          kind?: string | null
          name?: string
          source?: Database["public"]["Enums"]["place_source"]
          source_id?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "places_country_code_city_slug_fkey"
            columns: ["country_code", "city_slug"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["country_code", "slug"]
          },
        ]
      }
      price_rules: {
        Row: {
          country_code: string
          created_at: string
          detour_tolerance_pct: number
          divisor_includes_driver: boolean
          effective_from: string
          effective_to: string | null
          id: string
          max_stops: number
          max_trips_per_week: number
          rounding_cents: number
          source_reference: string | null
          version_label: string
        }
        Insert: {
          country_code: string
          created_at?: string
          detour_tolerance_pct?: number
          divisor_includes_driver?: boolean
          effective_from: string
          effective_to?: string | null
          id?: string
          max_stops?: number
          max_trips_per_week?: number
          rounding_cents?: number
          source_reference?: string | null
          version_label: string
        }
        Update: {
          country_code?: string
          created_at?: string
          detour_tolerance_pct?: number
          divisor_includes_driver?: boolean
          effective_from?: string
          effective_to?: string | null
          id?: string
          max_stops?: number
          max_trips_per_week?: number
          rounding_cents?: number
          source_reference?: string | null
          version_label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepts_cash: boolean
          accepts_yappy_direct: boolean
          bio: string | null
          created_at: string
          first_name: string
          gender: string | null
          home_city_id: string | null
          id: string
          is_id_verified: boolean
          is_phone_verified: boolean
          is_suspended: boolean
          last_initial: string | null
          linkedin_connected_at: string | null
          locale: string
          phone: string | null
          photo_url: string | null
          preferred_pay_channel: Database["public"]["Enums"]["payment_channel"]
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          accepts_cash?: boolean
          accepts_yappy_direct?: boolean
          bio?: string | null
          created_at?: string
          first_name: string
          gender?: string | null
          home_city_id?: string | null
          id: string
          is_id_verified?: boolean
          is_phone_verified?: boolean
          is_suspended?: boolean
          last_initial?: string | null
          linkedin_connected_at?: string | null
          locale?: string
          phone?: string | null
          photo_url?: string | null
          preferred_pay_channel?: Database["public"]["Enums"]["payment_channel"]
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          accepts_cash?: boolean
          accepts_yappy_direct?: boolean
          bio?: string | null
          created_at?: string
          first_name?: string
          gender?: string | null
          home_city_id?: string | null
          id?: string
          is_id_verified?: boolean
          is_phone_verified?: boolean
          is_suspended?: boolean
          last_initial?: string | null
          linkedin_connected_at?: string | null
          locale?: string
          phone?: string | null
          photo_url?: string | null
          preferred_pay_channel?: Database["public"]["Enums"]["payment_channel"]
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "metricas_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_cents: number
          cancellation_id: string
          created_at: string
          id: string
          issued_at: string | null
          payment_id: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["refund_status"]
        }
        Insert: {
          amount_cents: number
          cancellation_id: string
          created_at?: string
          id?: string
          issued_at?: string | null
          payment_id?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Update: {
          amount_cents?: number
          cancellation_id?: string
          created_at?: string
          id?: string
          issued_at?: string | null
          payment_id?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Relationships: [
          {
            foreignKeyName: "refunds_cancellation_id_fkey"
            columns: ["cancellation_id"]
            isOneToOne: false
            referencedRelation: "cancellations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          booking_id: string
          carro: number | null
          comment: string | null
          created_at: string
          encuentro: number | null
          id: string
          manejo: number | null
          puntualidad: number | null
          rating: number
          subject_id: string
          trato: number | null
        }
        Insert: {
          author_id: string
          booking_id: string
          carro?: number | null
          comment?: string | null
          created_at?: string
          encuentro?: number | null
          id?: string
          manejo?: number | null
          puntualidad?: number | null
          rating: number
          subject_id: string
          trato?: number | null
        }
        Update: {
          author_id?: string
          booking_id?: string
          carro?: number | null
          comment?: string | null
          created_at?: string
          encuentro?: number | null
          id?: string
          manejo?: number | null
          puntualidad?: number | null
          rating?: number
          subject_id?: string
          trato?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          days: number[]
          departure_time: string
          from_city_id: string
          id: string
          profile_id: string
          to_city_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days: number[]
          departure_time: string
          from_city_id: string
          id?: string
          profile_id: string
          to_city_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: number[]
          departure_time?: string
          from_city_id?: string
          id?: string
          profile_id?: string
          to_city_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_from_city_id_fkey"
            columns: ["from_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_to_city_id_fkey"
            columns: ["to_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      trip_stops: {
        Row: {
          created_at: string
          custom_label: string | null
          id: string
          kind: Database["public"]["Enums"]["stop_kind"]
          pickup_point_id: string | null
          scheduled_at: string | null
          sequence: number
          trip_id: string
        }
        Insert: {
          created_at?: string
          custom_label?: string | null
          id?: string
          kind: Database["public"]["Enums"]["stop_kind"]
          pickup_point_id?: string | null
          scheduled_at?: string | null
          sequence: number
          trip_id: string
        }
        Update: {
          created_at?: string
          custom_label?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["stop_kind"]
          pickup_point_id?: string | null
          scheduled_at?: string | null
          sequence?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_stops_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_stops_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "available_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_stops_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          accepts_luggage: boolean
          accepts_cash: boolean
          accepts_yappy_direct: boolean
          arrival_estimate_at: string | null
          cancelled_at: string | null
          completed_at: string | null
          corridor_id: string | null
          created_at: string
          departure_at: string
          destination_label: string | null
          destination_lat: number | null
          destination_lng: number | null
          destination_place_id: number | null
          driver_id: string
          gender_preference: Database["public"]["Enums"]["gender_pref"]
          id: string
          notes: string | null
          origin_label: string | null
          origin_lat: number | null
          origin_lng: number | null
          origin_place_id: number | null
          price_cents: number
          price_rule_id: string
          published_at: string | null
          recurrence: Database["public"]["Enums"]["trip_recurrence"]
          recurrence_parent_id: string | null
          seats_offered: number
          snap_cost_total_cents: number
          snap_distance_km: number
          snap_max_price_cents: number
          snap_occupants: number
          snap_rate_per_km_cents: number
          snap_toll_cents: number
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          accepts_luggage?: boolean
          accepts_cash?: boolean
          accepts_yappy_direct?: boolean
          arrival_estimate_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          corridor_id?: string | null
          created_at?: string
          departure_at: string
          destination_label?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_place_id?: number | null
          driver_id: string
          gender_preference?: Database["public"]["Enums"]["gender_pref"]
          id?: string
          notes?: string | null
          origin_label?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          origin_place_id?: number | null
          price_cents: number
          price_rule_id: string
          published_at?: string | null
          recurrence?: Database["public"]["Enums"]["trip_recurrence"]
          recurrence_parent_id?: string | null
          seats_offered: number
          snap_cost_total_cents: number
          snap_distance_km: number
          snap_max_price_cents: number
          snap_occupants: number
          snap_rate_per_km_cents: number
          snap_toll_cents: number
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          accepts_luggage?: boolean
          accepts_cash?: boolean
          accepts_yappy_direct?: boolean
          arrival_estimate_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          corridor_id?: string | null
          created_at?: string
          departure_at?: string
          destination_label?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_place_id?: number | null
          driver_id?: string
          gender_preference?: Database["public"]["Enums"]["gender_pref"]
          id?: string
          notes?: string | null
          origin_label?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          origin_place_id?: number | null
          price_cents?: number
          price_rule_id?: string
          published_at?: string | null
          recurrence?: Database["public"]["Enums"]["trip_recurrence"]
          recurrence_parent_id?: string | null
          seats_offered?: number
          snap_cost_total_cents?: number
          snap_distance_km?: number
          snap_max_price_cents?: number
          snap_occupants?: number
          snap_rate_per_km_cents?: number
          snap_toll_cents?: number
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_destination_place_id_fkey"
            columns: ["destination_place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_origin_place_id_fkey"
            columns: ["origin_place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_price_rule_id_fkey"
            columns: ["price_rule_id"]
            isOneToOne: false
            referencedRelation: "price_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "available_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_categories: {
        Row: {
          code: string
          label_es: string
          rate_per_km_cents: number
        }
        Insert: {
          code: string
          label_es: string
          rate_per_km_cents: number
        }
        Update: {
          code?: string
          label_es?: string
          rate_per_km_cents?: number
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          category_code: string
          color: string | null
          consumption_l_100km: number | null
          created_at: string
          id: string
          is_active: boolean
          make: string | null
          model: string | null
          owner_id: string
          photo_path: string | null
          plate_last3: string | null
          rate_per_km_cents: number | null
          seats_total: number
          year: number | null
        }
        Insert: {
          category_code: string
          color?: string | null
          consumption_l_100km?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          make?: string | null
          model?: string | null
          owner_id: string
          photo_path?: string | null
          plate_last3?: string | null
          rate_per_km_cents?: number | null
          seats_total: number
          year?: number | null
        }
        Update: {
          category_code?: string
          color?: string | null
          consumption_l_100km?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          make?: string | null
          model?: string | null
          owner_id?: string
          photo_path?: string | null
          plate_last3?: string | null
          rate_per_km_cents?: number | null
          seats_total?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signals: {
        Row: {
          converted_at: string | null
          created_at: string
          demand_signal_id: string
          id: string
          locale: string
          notified_at: string | null
          phone: string
          unsubscribed_at: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          demand_signal_id: string
          id?: string
          locale?: string
          notified_at?: string | null
          phone: string
          unsubscribed_at?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          demand_signal_id?: string
          id?: string
          locale?: string
          notified_at?: string | null
          phone?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_signals_demand_signal_id_fkey"
            columns: ["demand_signal_id"]
            isOneToOne: false
            referencedRelation: "demand_signals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      available_trips: {
        Row: {
          arrival_estimate_at: string | null
          bus_price_cents: number | null
          category_code: string | null
          color: string | null
          corridor_id: string | null
          corridor_slug: string | null
          departure_at: string | null
          distance_km: number | null
          driver_id: string | null
          first_name: string | null
          gender_preference: Database["public"]["Enums"]["gender_pref"] | null
          id: string | null
          is_id_verified: boolean | null
          last_initial: string | null
          make: string | null
          model: string | null
          photo_path: string | null
          photo_url: string | null
          price_cents: number | null
          rate_per_km_cents: number | null
          seats_available: number | null
          seats_offered: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      corridor_health: {
        Row: {
          active_drivers: number | null
          is_priority: boolean | null
          match_rate_pct: number | null
          seats_sold: number | null
          slug: string | null
          trips_published: number | null
          unserved_searches: number | null
        }
        Relationships: []
      }
      driver_ratings: {
        Row: {
          avg_carro: number | null
          avg_encuentro: number | null
          avg_manejo: number | null
          avg_puntualidad: number | null
          avg_rating: number | null
          avg_trato: number | null
          profile_id: string | null
          reviews_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reliability: {
        Row: {
          cancel_rate_pct: number | null
          cancellations: number | null
          driver_id: string | null
          late_cancellations: number | null
          publish_blocked: boolean | null
          trips_completed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      metricas_embudo_diario: {
        Row: {
          busquedas: number | null
          busquedas_sin_resultado: number | null
          cuentas_nuevas: number | null
          dia: string | null
          publicaciones: number | null
          reservas: number | null
          sesiones: number | null
          viajes_vistos: number | null
        }
        Relationships: []
      }
      metricas_eventos_diarios: {
        Row: {
          dia: string | null
          en_movil: number | null
          evento: string | null
          sesiones: number | null
          veces: number | null
        }
        Relationships: []
      }
      metricas_fuentes: {
        Row: {
          campana: string | null
          fuente: string | null
          sesiones: number | null
          sesiones_con_reserva: number | null
          tasa_conversion_pct: number | null
        }
        Relationships: []
      }
      metricas_rutas_buscadas: {
        Row: {
          busquedas: number | null
          destination_slug: string | null
          origin_slug: string | null
          pct_sin_resultado: number | null
          sin_resultado: number | null
          ultima_vez: string | null
        }
        Relationships: []
      }
      metricas_usuarios: {
        Row: {
          busquedas: number | null
          cedula_verificada: boolean | null
          first_name: string | null
          id: string | null
          metodo_registro: string | null
          registrado_el: string | null
          reservas: number | null
          telefono_verificado: boolean | null
          ultima_conexion: string | null
          veces_conectado: number | null
          viajes_publicados: number | null
          vino_de: string | null
        }
        Relationships: []
      }
      pending_demand: {
        Row: {
          contacts_pending: number | null
          corridor_id: string | null
          corridor_slug: string | null
          requested_date: string | null
          searches: number | null
          seats_wanted: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_signals_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          first_name: string | null
          has_linkedin: boolean | null
          home_city_id: string | null
          id: string | null
          is_id_verified: boolean | null
          last_initial: string | null
          photo_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          has_linkedin?: never
          home_city_id?: string | null
          id?: string | null
          is_id_verified?: boolean | null
          last_initial?: string | null
          photo_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          has_linkedin?: never
          home_city_id?: string | null
          id?: string | null
          is_id_verified?: boolean | null
          last_initial?: string | null
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "metricas_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      assert_balanced: { Args: { p_group: string }; Returns: undefined }
      bump_place: { Args: { place_id: number }; Returns: undefined }
      compute_price_cap: {
        Args: {
          p_category: string
          p_corridor_id: string
          p_country?: string
          p_seats: number
        }
        Returns: {
          cost_total_cents: number
          distance_km: number
          max_price_cents: number
          occupants: number
          rate_per_km_cents: number
          rule_id: string
          toll_cents: number
        }[]
      }
      compute_price_cap_vehicle: {
        Args: {
          p_corridor_id: string
          p_country?: string
          p_seats: number
          p_vehicle_id: string
        }
        Returns: {
          cost_total_cents: number
          distance_km: number
          max_price_cents: number
          occupants: number
          rate_per_km_cents: number
          rule_id: string
          toll_cents: number
        }[]
      }
      compute_refund: {
        Args: {
          p_at?: string
          p_booking_id: string
          p_by: Database["public"]["Enums"]["cancel_party"]
        }
        Returns: {
          goodwill_cents: number
          hours_before: number
          is_free_cancel: boolean
          policy_id: string
          refund_cents: number
          retained_cents: number
          tier: string
        }[]
      }
      demanda_reciente: {
        Args: { p_destino: string; p_dias?: number; p_origen: string }
        Returns: number
      }
      disablelongtransactions: { Args: never; Returns: string }
      driver_balance_cents: { Args: { p_driver_id: string }; Returns: number }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      inmutable_unaccent: { Args: { "": string }; Returns: string }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      rate_from_consumption: { Args: { p_l100: number }; Returns: number }
      registrar_busqueda: {
        Args: {
          p_destino: string
          p_fecha: string
          p_origen: string
          p_puestos?: number
          p_resultados?: number
          p_sesion?: string
        }
        Returns: undefined
      }
      search_places: {
        Args: { max_results?: number; near_city?: string; q: string }
        Returns: {
          address: string
          city_slug: string
          id: number
          kind: string
          lat: number
          lng: number
          name: string
          source: Database["public"]["Enums"]["place_source"]
        }[]
      }
      seats_taken: { Args: { p_trip_id: string }; Returns: number }
      seats_taken_between: {
        Args: {
          p_exclude?: string
          p_from_seq: number
          p_to_seq: number
          p_trip_id: string
        }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled_passenger"
        | "cancelled_driver"
        | "no_show_passenger"
        | "no_show_driver"
        | "rejected_driver"
      cancel_party: "passenger" | "driver" | "platform" | "system"
      gender_pref: "any" | "women_only"
      ledger_account:
        | "passenger_escrow"
        | "driver_payable"
        | "platform_revenue"
        | "platform_tax"
        | "psp_fees"
        | "refunds"
        | "promotions"
      payment_channel: "external" | "card" | "yappy_app"
      payment_status:
        | "initiated"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
      payout_status: "pending" | "sent" | "confirmed" | "failed"
      place_source: "osm" | "overture" | "usuario" | "catalogo"
      refund_status: "pending" | "issued" | "failed"
      stop_kind: "origin" | "waypoint" | "destination"
      trip_recurrence: "none" | "daily" | "weekly" | "monthly"
      trip_status:
        | "draft"
        | "published"
        | "in_progress"
        | "completed"
        | "cancelled"
      verification_status: "pending" | "verified" | "rejected" | "expired"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled_passenger",
        "cancelled_driver",
        "no_show_passenger",
        "no_show_driver",
        "rejected_driver",
      ],
      cancel_party: ["passenger", "driver", "platform", "system"],
      gender_pref: ["any", "women_only"],
      ledger_account: [
        "passenger_escrow",
        "driver_payable",
        "platform_revenue",
        "platform_tax",
        "psp_fees",
        "refunds",
        "promotions",
      ],
      payment_channel: ["external", "card", "yappy_app"],
      payment_status: [
        "initiated",
        "authorized",
        "captured",
        "failed",
        "refunded",
      ],
      payout_status: ["pending", "sent", "confirmed", "failed"],
      place_source: ["osm", "overture", "usuario", "catalogo"],
      refund_status: ["pending", "issued", "failed"],
      stop_kind: ["origin", "waypoint", "destination"],
      trip_recurrence: ["none", "daily", "weekly", "monthly"],
      trip_status: [
        "draft",
        "published",
        "in_progress",
        "completed",
        "cancelled",
      ],
      verification_status: ["pending", "verified", "rejected", "expired"],
    },
  },
} as const
