--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_commissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    agent_id character varying NOT NULL,
    source_agent_id character varying NOT NULL,
    subscription_payment_id character varying NOT NULL,
    level integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    product_id character varying,
    quantity integer DEFAULT 1,
    size text,
    color text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    name_rw text NOT NULL,
    description text,
    image_url text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    producer_id character varying NOT NULL,
    tin text,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    location text NOT NULL,
    logo_url text,
    website_url text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_subscriptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    source text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    product_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    reference_id text
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying,
    product_id character varying,
    quantity integer DEFAULT 1,
    price numeric(10,2) NOT NULL,
    size text,
    color text
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying,
    producer_id character varying,
    total numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    shipping_address text,
    created_at timestamp without time zone DEFAULT now(),
    payment_status text DEFAULT 'pending'::text,
    tracking_number text,
    notes text,
    size_evidence_images text[],
    is_confirmed_by_customer boolean DEFAULT false,
    customer_confirmation_date timestamp without time zone,
    validation_status text DEFAULT 'pending'::text
);


--
-- Name: outfit_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outfit_collections (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    name text NOT NULL,
    description text,
    occasion text,
    season text,
    cover_image_url text,
    is_public boolean DEFAULT false,
    likes integer DEFAULT 0,
    views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    items jsonb DEFAULT '[]'::jsonb
);


--
-- Name: payment_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_settings (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    amount_in_rwf integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_settings_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.payment_settings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payment_settings_new_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    name_rw text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    category_id character varying,
    producer_id character varying,
    image_url text NOT NULL,
    additional_images text[],
    sizes text[],
    colors text[],
    stock_quantity integer DEFAULT 0,
    in_stock boolean DEFAULT true,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    display_order integer
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    product_id character varying,
    order_id character varying,
    rating integer NOT NULL,
    comment text,
    images text[],
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: session_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_comments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying NOT NULL,
    user_id character varying NOT NULL,
    text text NOT NULL,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    subscription_id character varying NOT NULL,
    agent_id character varying,
    amount numeric(10,2) NOT NULL,
    agent_commission numeric(10,2),
    payment_method text NOT NULL,
    payment_reference text,
    status text DEFAULT 'pending'::text NOT NULL,
    transaction_id text,
    created_at timestamp without time zone DEFAULT now(),
    agent_payout_status text DEFAULT 'pending'::text,
    agent_payout_date timestamp without time zone,
    agent_payout_reference text,
    agent_payout_notes text
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    name_rw text NOT NULL,
    description text NOT NULL,
    description_rw text NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    annual_price numeric(10,2) NOT NULL,
    features text[] NOT NULL,
    features_rw text[] NOT NULL,
    max_products integer DEFAULT 0,
    max_orders integer DEFAULT 0,
    has_analytics boolean DEFAULT false,
    has_priority_support boolean DEFAULT false,
    has_custom_branding boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    agent_id character varying,
    status text DEFAULT 'active'::text NOT NULL,
    billing_cycle text NOT NULL,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text,
    payment_reference text,
    auto_renew boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: try_on_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.try_on_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    customer_image_url text NOT NULL,
    product_id character varying,
    try_on_image_url text,
    fit_recommendation text,
    status text DEFAULT 'processing'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_favorite boolean DEFAULT false,
    notes text,
    rating integer,
    customer_image_local_path character varying(500),
    try_on_image_local_path character varying(500),
    liked_by text[] DEFAULT '{}'::text[],
    saved_by text[] DEFAULT '{}'::text[],
    is_hidden boolean DEFAULT false,
    likes integer DEFAULT 0,
    views integer DEFAULT 0
);


--
-- Name: user_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_wallets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    full_name text,
    full_name_rw text,
    phone text,
    location text,
    role text DEFAULT 'customer'::text NOT NULL,
    business_name text,
    business_license text,
    is_verified boolean DEFAULT false,
    measurements text,
    profile_image text,
    created_at timestamp without time zone DEFAULT now(),
    terms_accepted boolean DEFAULT false,
    terms_accepted_at timestamp without time zone,
    referral_code text,
    referred_by character varying,
    is_active boolean DEFAULT true,
    style_profile jsonb DEFAULT '{}'::jsonb,
    reset_token text,
    reset_token_expires timestamp without time zone
);


--
-- Name: wallet_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    wallet_id character varying NOT NULL,
    user_id character varying NOT NULL,
    type text DEFAULT 'topup'::text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'RWF'::text NOT NULL,
    method text DEFAULT 'mobile_money'::text NOT NULL,
    provider text DEFAULT 'mtn'::text,
    phone text,
    status text DEFAULT 'pending'::text NOT NULL,
    external_reference text,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Data for Name: agent_commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_commissions (id, agent_id, source_agent_id, subscription_payment_id, level, amount, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, user_id, product_id, quantity, size, color, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, name_rw, description, image_url, created_at) FROM stdin;
7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	Women's Fashion	Imyenda y'Abagore	Dresses, skirts, tops and more	https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&h=600	2025-08-28 18:55:31.885
d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	Men's Fashion	Imyenda y'Abagabo	Shirts, trousers, suits and more	https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&h=600	2025-08-28 18:55:31.885
6a804b6c-106b-41b6-abca-400182d56b77	Accessories	Ibikoresho	Bags, jewelry, hats and more	https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?auto=format&fit=crop&w=800&h=600	2025-08-28 18:55:31.885
7faaa9e1-7930-472f-9f47-8ec368864993	Kids	Abana	Clothing for children	https://images.unsplash.com/photo-1519455953755-af066f52f1ea?auto=format&fit=crop&w=800&h=600	2025-08-28 18:55:31.885
7a4f1a86-53f9-484a-9cf0-7fa9942a6534	Traditional	Gakondo	Traditional Rwandan styles	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&h=600	2025-08-28 18:55:31.885
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, producer_id, tin, name, email, phone, location, logo_url, website_url, created_at) FROM stdin;
cca07194-aadc-4bd2-8aaa-86ec24b807a2	9c2c8704-8380-48af-bbfc-90e274e5d0c0	1092390234	Universal Bridge Ltd	producer@demo.com	0782634364	Kigali Rwanda	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrrWPtot5jd2LddIUNaMbu6yh8gXlnKBvgkA&s	https://nyambika.com/	2025-08-28 21:47:38.56666
acfe1f37-6b46-4a43-9523-e59b405d2b80	45f12178-a476-435e-8edd-c2f578d2ddd3	2384723	Amazing Clothing	amazing@gmail.com	0782635342	Kigali Rwanda	https://static.vecteezy.com/system/resources/previews/008/976/210/non_2x/clothing-store-logo-design-with-hanger-illustration-vector.jpg	https://chatgpt.com/	2025-08-29 18:58:35.379867
615dbad2-fb88-453d-bcab-beba7c5b6a92	019f6d48-dd0e-479c-afb4-82ca4480b5af	1102394	Ambara House of Fashion	ambara@gmail.com	078324978	Kigali City	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSlodMEokiGqsTwvB0HRr5Et2e_sGub5eHjQ&s	https://nyambika.com	2025-08-29 19:13:40.399455
dde97352-65ab-4255-b303-a262f4ec68f5	cb82ceb5-5d3b-4104-af66-e6a390574319	1223091283	Rex Shoes	rexshoes@gmail.com	07834759432	Kigali Rwanda	data:image/jpeg;base64,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	https://nyambika.com	2025-08-29 19:24:15.75554
c7dc4b14-52ed-4c2e-a5e6-c7cb118a4af4	96dc6819-d310-4720-8af9-38f3c092c138	\N	Kigali Styles Co.	producer1@nyambika.ai	+250780000001	Kigali	\N	\N	2026-04-04 13:20:51.09834
b6ded547-89e7-4281-a227-be0eab32f5f6	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	\N	Nyamirambo Fashion House	producer2@nyambika.ai	+250780000002	Nyamirambo	\N	\N	2026-04-04 13:20:51.165331
\.


--
-- Data for Name: email_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_subscriptions (id, email, source, created_at) FROM stdin;
060cee83-9626-48a6-8ff0-367cfcd1bdc0	newsletter_pg@test.com	test	2026-04-04 00:33:44.51174
cd9c1e30-0a84-4d8e-aed0-85b60891c168	nl3@test.com	test	2026-04-04 00:36:31.274951
7d08aaf1-fd22-4cfc-9a6f-4204a7b2cc91	debugtest@test.com	\N	2026-04-04 12:30:14.06112
d0a6a35c-8b92-4740-8e1f-7503a9fb6616	direct_test_1775298855383@test.com	\N	2026-04-04 12:34:15.383314
17da7743-2983-4349-8f0b-31ccb2060740	nl1775299932438@test.com	\N	2026-04-04 12:52:12.710396
9beb1911-d812-4a3e-bf85-a335a6e35832	nl1775300718580@test.com	\N	2026-04-04 13:05:18.869042
5c0ed9fe-cbad-48bf-8046-3bd1475269e8	nl1775300742692@test.com	\N	2026-04-04 13:05:42.937047
db6507ff-d466-43b4-bec2-f6a984ab8572	nl1775301565706@test.com	\N	2026-04-04 13:19:25.92235
987eb037-8132-46f5-9dea-feac349417c8	nl1775301743110@test.com	\N	2026-04-04 13:22:23.346235
229df5c6-e330-4fd7-ab2c-4e47ca70b089	nl1775304747773@test.com	\N	2026-04-04 14:12:28.031536
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.favorites (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at, reference_id) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, quantity, price, size, color) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, customer_id, producer_id, total, status, payment_method, shipping_address, created_at, payment_status, tracking_number, notes, size_evidence_images, is_confirmed_by_customer, customer_confirmation_date, validation_status) FROM stdin;
\.


--
-- Data for Name: outfit_collections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outfit_collections (id, user_id, name, description, occasion, season, cover_image_url, is_public, likes, views, created_at, updated_at, items) FROM stdin;
f4c95f8c-bbb3-44be-bfc0-88515cc4d7e4	12c2fc98-d1e8-4944-8429-f34a8489a6d2	Test Collection	Test	casual	\N	\N	f	0	0	2026-04-04 00:34:04.488063	2026-04-04 00:34:04.488063	[]
5ff852bf-71c5-411d-8697-c0732041a0f0	12c2fc98-d1e8-4944-8429-f34a8489a6d2	My Outfit	\N	\N	\N	\N	f	0	0	2026-04-04 00:36:31.115099	2026-04-04 00:36:31.115099	[]
\.


--
-- Data for Name: payment_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_settings (id, name, description, amount_in_rwf, created_at, updated_at) FROM stdin;
1	try_on_fee	Fee for using the AI Try-On feature	500	2026-04-04 13:23:21.794875+02	2026-04-04 13:23:21.794875+02
2	product_boost	Boost product visibility to first page	100	2026-04-04 13:23:21.794875+02	2026-04-04 13:23:21.794875+02
3	product_ads	Ads on first page per product	5000	2026-04-04 13:23:21.794875+02	2026-04-04 13:23:21.794875+02
4	company_boost	Boost company visibility to first page	10000	2026-04-04 13:23:21.794875+02	2026-04-04 13:23:21.794875+02
5	agent_signup_bonus	Wallet credit when a referred agent signs up	2000	2026-04-04 13:23:21.924418+02	2026-04-04 13:23:21.924418+02
6	agent_referral_l1_percent	Level 1 referral percent (basis points where 10000 = 100%)	1000	2026-04-04 13:23:21.924418+02	2026-04-04 13:23:21.924418+02
7	agent_referral_l2_percent	Level 2 referral percent (basis points)	500	2026-04-04 13:23:21.924418+02	2026-04-04 13:23:21.924418+02
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, name_rw, description, price, category_id, producer_id, image_url, additional_images, sizes, colors, stock_quantity, in_stock, is_approved, created_at, display_order) FROM stdin;
104bc21f-0883-470e-b7db-850f6a066125	Casual Pants by Amazing Market	Casual Pants	Casual Pants high-quality apparel	30000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.179	\N
4a6216c5-1d2f-4fc7-af36-e8d0682245d2	Classic Shirt by Amazing Market	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.175	\N
501bb586-cb5d-4d0b-a90f-15b2358a42f6	Classic Shirt by Amazing Market	Classic Shirt	Classic Shirt high-quality apparel	25000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.18	\N
097345b9-03b7-4012-bfa9-9594325abe4b	Elegant Dress by Amazing Market	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.178	\N
001aa179-ecfa-4b25-8664-6691ea81439a	Elegant Dress by Amazing Market	Elegant Dress	Elegant Dress high-quality apparel	45000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.181	\N
863001a2-60d3-4354-b407-a2a39699660e	Casual Pants by Amazing Market	Casual Pants	Casual Pants high-quality apparel	30000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.182	\N
d0b97558-1ebb-4b7e-a57d-99d904c694d2	Casual Pants by Amazing Market	Casual Pants	Casual Pants high-quality apparel	30000.00	6a804b6c-106b-41b6-abca-400182d56b77	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.184	\N
c8ed2960-c268-4d71-9cb0-57aff1a59eeb	Casual Pants by Amazing Market	Casual Pants	Casual Pants high-quality apparel	30000.00	7faaa9e1-7930-472f-9f47-8ec368864993	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.185	\N
bc1012ea-0553-4cd5-a287-b090b01ab3ab	Casual Pants by Amazing Market	Casual Pants	Casual Pants high-quality apparel	30000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.187	\N
72563708-f967-4dfa-9bbf-4b452d7dff3c	Casual Pants by Ambara House	Casual Pants	Casual Pants high-quality apparel	30000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.188	\N
eb2a5742-0222-4fa8-be21-149292562551	Casual Pants by Ambara House	Casual Pants	Casual Pants high-quality apparel	30000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.19	\N
e30ead52-eea3-41e7-8207-89570b0fe78d	Elegant Dress by Amazing Market	Elegant Dress	Elegant Dress high-quality apparel	45000.00	6a804b6c-106b-41b6-abca-400182d56b77	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.184	\N
3d784ec3-4e41-46d2-bb3e-2a4f95734e08	Elegant Dress by Amazing Market	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7faaa9e1-7930-472f-9f47-8ec368864993	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.185	\N
03871308-636f-4ca1-b04f-339cc0492f66	Elegant Dress by Amazing Market	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.186	\N
3b6e3af8-04b5-4383-a686-dc09f7a0c884	Elegant Dress by Ambara House	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.188	\N
d78c0d02-0602-468f-9739-8cc99985d9f8	Elegant Dress by Ambara House	Elegant Dress	Elegant Dress high-quality apparel	45000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.19	\N
dd97501e-d2ae-4bcf-a468-a0de6f747f9a	Elegant Dress by Ambara House	Elegant Dress	Elegant Dress high-quality apparel	45000.00	6a804b6c-106b-41b6-abca-400182d56b77	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.192	\N
9f982424-6e1e-4dde-82ef-b669a454e49d	Casual Pants by Ambara House	Casual Pants	Casual Pants high-quality apparel	30000.00	6a804b6c-106b-41b6-abca-400182d56b77	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.193	\N
d0c606a7-2da0-404b-aa4f-20d2addacd6b	Casual Pants by Ambara House	Casual Pants	Casual Pants high-quality apparel	30000.00	7faaa9e1-7930-472f-9f47-8ec368864993	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.194	\N
d48f303d-4668-4952-9a6f-fbb29d3bf62b	Casual Pants by Ambara House	Casual Pants	Casual Pants high-quality apparel	30000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.196	\N
77c63da9-1e48-4bc4-a1e7-8268021e52b5	Casual Pants by Rex Shoes	Casual Pants	Casual Pants high-quality apparel	30000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.197	\N
d90337a1-c486-43ec-9e92-45e03efe124f	Casual Pants by Rex Shoes	Casual Pants	Casual Pants high-quality apparel	30000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.198	\N
016c9f58-187a-4fbd-b3d0-3177a2c5cef9	Casual Pants by Rex Shoes	Casual Pants	Casual Pants high-quality apparel	30000.00	6a804b6c-106b-41b6-abca-400182d56b77	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.199	\N
1021926f-ad8b-4275-b9ed-317e111f2e16	Elegant Dress by Ambara House	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7faaa9e1-7930-472f-9f47-8ec368864993	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.194	\N
af22758b-23bd-41d2-9357-7865b9fb5975	Elegant Dress by Ambara House	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.195	\N
399e46a9-a1c3-40ff-a11c-94a255fbfb9f	Elegant Dress by Rex Shoes	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.196	\N
8fce0400-d4f8-4620-8bd8-ccabe203cc5c	Elegant Dress by Rex Shoes	Elegant Dress	Elegant Dress high-quality apparel	45000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.197	\N
6140eca0-ecf3-4741-b4e4-f4d67aaa577e	Elegant Dress by Rex Shoes	Elegant Dress	Elegant Dress high-quality apparel	45000.00	6a804b6c-106b-41b6-abca-400182d56b77	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.198	\N
38d83c89-0828-4b05-a8cd-f0f293c937bc	Elegant Dress by Rex Shoes	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7faaa9e1-7930-472f-9f47-8ec368864993	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.199	\N
98df8c46-16b6-43a3-baf3-7f4136bc6566	Casual Pants by Rex Shoes	Casual Pants	Casual Pants high-quality apparel	30000.00	7faaa9e1-7930-472f-9f47-8ec368864993	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.2	\N
53fea68a-2295-4118-826d-fb84e651952e	Casual Pants by Rex Shoes	Casual Pants	Casual Pants high-quality apparel	30000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.201	\N
84f737e2-e250-4672-9d56-4832eed86ffb	Casual Pants by Producer	Casual Pants	Casual Pants high-quality apparel	30000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.202	\N
eed29d51-f484-4ab3-ab98-c8c63edc9ba7	Casual Pants by Producer	Casual Pants	Casual Pants high-quality apparel	30000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.203	\N
40b3dc11-7eea-4f06-97b1-ca700e5da982	Casual Pants by Producer	Casual Pants	Casual Pants high-quality apparel	30000.00	6a804b6c-106b-41b6-abca-400182d56b77	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.204	\N
b14d5e88-357e-424f-95fb-adfc585d7bae	Casual Pants by Producer	Casual Pants	Casual Pants high-quality apparel	30000.00	7faaa9e1-7930-472f-9f47-8ec368864993	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.205	\N
d0336955-5853-424c-986e-ccdd19be822b	Elegant Dress by Rex Shoes	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.201	\N
7f5ce7ab-94f9-4664-bf5f-fbb85b54f87a	Elegant Dress by Producer	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.202	\N
a42ba153-e4be-4c5c-9ee7-24dd6773f832	Elegant Dress by Producer	Elegant Dress	Elegant Dress high-quality apparel	45000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.202	\N
3fe93ecd-998c-4e99-90c5-7363615e9ada	Elegant Dress by Producer	Elegant Dress	Elegant Dress high-quality apparel	45000.00	6a804b6c-106b-41b6-abca-400182d56b77	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.203	\N
9b106cff-3fa1-467f-b95c-62e480070a80	Elegant Dress by Producer	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7faaa9e1-7930-472f-9f47-8ec368864993	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.204	\N
24978a87-a059-44c1-bbf5-352d2298afa5	Elegant Dress by Producer	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.205	\N
8b840b4a-6af6-4703-8195-5887b2d3fe13	Casual Pants by Producer	Casual Pants	Casual Pants high-quality apparel	30000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.206	\N
e897ee8e-b79a-4a26-b44d-c1d150416b75	Casual Pants by Producer One	Casual Pants	Casual Pants high-quality apparel	30000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.207	\N
199b37f6-4b81-4544-90a6-91f7a68ce38d	Casual Pants by Producer One	Casual Pants	Casual Pants high-quality apparel	30000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.209	\N
3428273e-e924-438f-afa2-6504f099ba24	Casual Pants by Producer One	Casual Pants	Casual Pants high-quality apparel	30000.00	6a804b6c-106b-41b6-abca-400182d56b77	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.21	\N
fd180bc3-5293-4bc0-b5c2-615acd877712	Casual Pants by Producer One	Casual Pants	Casual Pants high-quality apparel	30000.00	7faaa9e1-7930-472f-9f47-8ec368864993	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.211	\N
c242fb4a-bef8-4a4b-8a62-b4d6497006d2	Casual Pants by Producer One	Casual Pants	Casual Pants high-quality apparel	30000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.212	\N
6755743a-adc6-494a-a4cd-fa273e581d2f	Elegant Dress by Producer One	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.206	\N
069075c8-2f81-4c3d-b053-3296804e5dd5	Elegant Dress by Producer One	Elegant Dress	Elegant Dress high-quality apparel	45000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.208	\N
d88d3e1b-4833-4a02-b346-13ec92a7f3bb	Elegant Dress by Producer One	Elegant Dress	Elegant Dress high-quality apparel	45000.00	6a804b6c-106b-41b6-abca-400182d56b77	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.21	\N
788a419b-1ad0-423b-8f77-9b49f8a4c538	Elegant Dress by Producer One	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7faaa9e1-7930-472f-9f47-8ec368864993	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.211	\N
c450588f-1814-4e78-8d6c-8482476da1f8	Elegant Dress by Producer One	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.212	\N
7c2d3794-6361-44b4-961a-b1cd067bd1b9	Elegant Dress by Producer Two	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.213	\N
e0aa5073-2026-482a-9f81-929fa6a87238	Casual Pants by Producer Two	Casual Pants	Casual Pants high-quality apparel	30000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.213	\N
bbe43fc5-422c-48ed-b70e-59ef55286877	Casual Pants by Producer Two	Casual Pants	Casual Pants high-quality apparel	30000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.214	\N
4bee4e69-a14b-4e51-8683-492acff954f6	Casual Pants by Producer Two	Casual Pants	Casual Pants high-quality apparel	30000.00	6a804b6c-106b-41b6-abca-400182d56b77	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.216	\N
280ed5ed-c16f-4371-b76a-12ac4f9c7e8c	Casual Pants by Producer Two	Casual Pants	Casual Pants high-quality apparel	30000.00	7faaa9e1-7930-472f-9f47-8ec368864993	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.217	\N
8bb7d93f-85bc-46b8-b8d3-3a1cc8aaf1c1	Casual Pants by Producer Two	Casual Pants	Casual Pants high-quality apparel	30000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.218	\N
8284df2a-55ec-47e4-9465-70aad805d2b0	Classic Shirt by Amazing Market	Classic Shirt	Classic Shirt high-quality apparel	25000.00	6a804b6c-106b-41b6-abca-400182d56b77	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.183	\N
cbc49466-5488-4f76-89cf-e7528ca5aad4	Classic Shirt by Amazing Market	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7faaa9e1-7930-472f-9f47-8ec368864993	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.185	\N
ce34d1b3-cbd4-4798-a43c-d2b233afa349	Classic Shirt by Amazing Market	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	45f12178-a476-435e-8edd-c2f578d2ddd3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.186	\N
767471d8-cca8-4a4f-969c-c1cdc9268d5c	Classic Shirt by Ambara House	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.187	\N
af17bc17-f2d8-4517-8733-9c10d3f63367	Classic Shirt by Ambara House	Classic Shirt	Classic Shirt high-quality apparel	25000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.189	\N
28788e16-4567-40bc-89cd-82b0e438d0ee	Elegant Dress by Producer Two	Elegant Dress	Elegant Dress high-quality apparel	45000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.214	\N
c09f07aa-da8c-43ee-89f9-47f5959e4e1a	Elegant Dress by Producer Two	Elegant Dress	Elegant Dress high-quality apparel	45000.00	6a804b6c-106b-41b6-abca-400182d56b77	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.215	\N
9a549f2a-69bf-41c0-ba5c-92f4b07fa668	Elegant Dress by Producer Two	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7faaa9e1-7930-472f-9f47-8ec368864993	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.216	\N
ca89102a-4fd3-46dd-91c0-6c10e34ef199	Elegant Dress by Producer Two	Elegant Dress	Elegant Dress high-quality apparel	45000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.217	\N
3a3aee53-9f46-4b52-91e8-3d0495f44455	Classic Shirt by Ambara House	Classic Shirt	Classic Shirt high-quality apparel	25000.00	6a804b6c-106b-41b6-abca-400182d56b77	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.191	\N
5e4c6fe1-08fa-403f-87c0-46b8aa950f1b	Classic Shirt by Ambara House	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7faaa9e1-7930-472f-9f47-8ec368864993	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.193	\N
cd916674-613e-4b9d-a8fa-050171205c45	Classic Shirt by Ambara House	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	019f6d48-dd0e-479c-afb4-82ca4480b5af	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.195	\N
9c26628f-a21d-4219-b906-13946692e789	Classic Shirt by Rex Shoes	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.196	\N
4a16a4ac-3ccc-4c0b-9275-880f336c1ef0	Classic Shirt by Rex Shoes	Classic Shirt	Classic Shirt high-quality apparel	25000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.197	\N
fbfc1785-3cc3-4f8c-bf40-03eaba5e7ab0	Classic Shirt by Rex Shoes	Classic Shirt	Classic Shirt high-quality apparel	25000.00	6a804b6c-106b-41b6-abca-400182d56b77	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.198	\N
91c0f4cb-7519-41cf-935a-4993e9992a4a	Classic Shirt by Rex Shoes	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7faaa9e1-7930-472f-9f47-8ec368864993	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.199	\N
2b6dc35f-fbca-4e67-b0ff-42a2df4b3e57	Classic Shirt by Rex Shoes	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	cb82ceb5-5d3b-4104-af66-e6a390574319	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.2	\N
bfb895ce-322a-41e3-9a37-fcfcf8e15d38	Classic Shirt by Producer	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.201	\N
b2efd62a-da51-4d5b-b94d-615467d66aff	Classic Shirt by Producer	Classic Shirt	Classic Shirt high-quality apparel	25000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.202	\N
27f802f4-e0dd-460c-a128-f6067fc8ab5a	Classic Shirt by Producer	Classic Shirt	Classic Shirt high-quality apparel	25000.00	6a804b6c-106b-41b6-abca-400182d56b77	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.203	\N
b02b67c2-e13f-4ba5-a27b-e19f99527ef7	Classic Shirt by Producer	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7faaa9e1-7930-472f-9f47-8ec368864993	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.204	\N
e9bcba2c-5930-4456-8dfd-a4b448d7bf9f	Classic Shirt by Producer	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	9c2c8704-8380-48af-bbfc-90e274e5d0c0	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.205	\N
153dbe5e-3291-4885-b80a-42066c8f5be6	Classic Shirt by Producer One	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.206	\N
2be8e2b8-9ec0-4be8-a90a-358fea02f83c	Classic Shirt by Producer One	Classic Shirt	Classic Shirt high-quality apparel	25000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.208	\N
354f27b0-02c3-4e72-8f9c-1aa9ae2c8761	Classic Shirt by Producer One	Classic Shirt	Classic Shirt high-quality apparel	25000.00	6a804b6c-106b-41b6-abca-400182d56b77	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.209	\N
227f16ec-3465-4c23-82e3-f88113de39a3	Classic Shirt by Producer One	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7faaa9e1-7930-472f-9f47-8ec368864993	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.21	\N
d249f6da-5cad-4556-a2ce-bd97571e44ad	Classic Shirt by Producer One	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	96dc6819-d310-4720-8af9-38f3c092c138	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.211	\N
e30c3e1d-fadf-44c7-8c6b-39c636fe0371	Classic Shirt by Producer Two	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7108f5f9-b64e-48f9-b35f-bcaad65bb1f8	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.212	\N
cb0d382c-7790-4531-8f6c-d2cf71ed1f8b	Classic Shirt by Producer Two	Classic Shirt	Classic Shirt high-quality apparel	25000.00	d2ea8f72-41d9-4b1d-8c04-c8ed08c2d0f6	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.213	\N
be6648f8-d7ca-4821-8fca-9e811464f60c	Classic Shirt by Producer Two	Classic Shirt	Classic Shirt high-quality apparel	25000.00	6a804b6c-106b-41b6-abca-400182d56b77	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.215	\N
bb81150b-7464-437c-b2a0-31f5d208ad0d	Classic Shirt by Producer Two	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7faaa9e1-7930-472f-9f47-8ec368864993	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.216	\N
f0b99501-71c9-447f-9112-f7bc17860c9c	Classic Shirt by Producer Two	Classic Shirt	Classic Shirt high-quality apparel	25000.00	7a4f1a86-53f9-484a-9cf0-7fa9942a6534	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=300	{}	{S,M,L}	{Black,White}	20	t	t	2026-04-04 11:20:51.217	\N
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, user_id, product_id, order_id, rating, comment, images, is_verified, created_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schema_migrations (filename, applied_at) FROM stdin;
0004_add_payment_settings.sql	2026-04-04 12:40:41.210092+02
0005_fix_payment_settings_id.sql	2026-04-04 12:40:41.210092+02
0006_fix_payment_settings_id_final.sql	2026-04-04 12:40:41.210092+02
0007_create_payment_settings.sql	2026-04-04 12:40:41.210092+02
0008_create_user_wallets.sql	2026-04-04 12:40:41.210092+02
0009_add_agent_payout_fields.sql	2026-04-04 12:40:41.210092+02
0011_create_email_subscriptions.sql	2026-04-04 12:40:41.210092+02
0012_add_user_terms.sql	2026-04-04 12:40:41.210092+02
0013_add_referral_and_commissions.sql	2026-04-04 12:40:41.210092+02
0014_seed_agent_bonus_settings.sql	2026-04-04 12:40:41.210092+02
0019_add_outfit_room_tables.sql	2026-04-04 12:40:41.210092+02
0021_add_image_local_paths.sql	2026-04-04 12:40:41.210092+02
0022_add_session_social_features.sql	2026-04-04 12:40:41.210092+02
0023_schema_optimize_json.sql	2026-04-04 12:40:41.210092+02
0024_add_missing_session_columns.sql	2026-04-04 12:40:41.210092+02
0025_mysql_to_postgres_data_cleanup.sql	2026-04-04 12:40:41.210092+02
\.


--
-- Data for Name: session_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_comments (id, session_id, user_id, text, is_deleted, created_at, updated_at) FROM stdin;
bde69acf-45d3-4332-a597-e98032a13b8b	6f07f7b9-c865-47c6-93da-e06ceb059865	1134de61-bc26-4e7f-9ea7-4bdd0739e376	Looks great!	t	2026-04-04 13:22:23.329	2026-04-04 13:22:23.329
b87bb952-79fc-4e21-bea6-7514ff43efb9	fdc0e057-226b-4cb3-9cec-a36851633680	f2f04302-bef1-411a-9d3b-b03b148287f7	Looks great!	t	2026-04-04 14:12:28.004948	2026-04-04 14:12:28.004948
\.


--
-- Data for Name: subscription_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_payments (id, subscription_id, agent_id, amount, agent_commission, payment_method, payment_reference, status, transaction_id, created_at, agent_payout_status, agent_payout_date, agent_payout_reference, agent_payout_notes) FROM stdin;
28c7eb48-d617-46c4-bcbd-e2af14cf2fb9	9e414600-9011-4cfb-944a-2d3ee42a29d5	bc8de22d-caed-47c8-b081-b6176d8fd1d6	5000.00	1000.00	mtn_mobile_money	400000	completed	\N	2025-08-29 19:45:20.614631	pending	\N	\N	\N
fe1252a1-ca4b-4fa6-8fe7-2c9741560197	571cb531-083c-40be-a526-d235f2b705a1	\N	35000.00	0.00	mobile_money	\N	completed	\N	2026-04-04 11:20:51.166	pending	\N	\N	\N
9ecbd54d-f075-4108-a8b3-da5d01ac4ca7	2df868bc-169f-4141-8297-fdbc286fb12c	\N	35000.00	0.00	mobile_money	\N	completed	\N	2026-04-04 11:20:51.166	pending	\N	\N	\N
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, name, name_rw, description, description_rw, monthly_price, annual_price, features, features_rw, max_products, max_orders, has_analytics, has_priority_support, has_custom_branding, is_active, created_at) FROM stdin;
51eaab41-6922-42a5-895d-fae65ce2bb16	Starter	Intangiriro	Perfect for small businesses getting started with online sales	Byiza kubucuruzi buto butangira gucuruza kumurongo	5000.00	50000.00	{"Up to 50 products","Basic analytics","Email support","Mobile payment integration","Basic store customization"}	{"Ibicuruzwa bigera kuri 50","Isesengura ry'ibanze","Ubufasha bwa imeyili","Kwishyura na telefoni","Guhindura iduka ry'ibanze"}	50	200	t	f	f	t	2025-08-28 20:55:31.882663
71cbb5eb-8643-44be-96e1-fdfb7a390767	Professional	Umwuga	Ideal for growing businesses with advanced features	Byiza kubucuruzi bukura bufite ibikoresho byihuse	10000.00	110000.00	{"Up to 200 products","Advanced analytics & insights","Priority email & chat support","Multiple payment methods","Custom branding","Inventory management","Customer reviews system"}	{"Ibicuruzwa bigera kuri 200","Isesengura ryihuse n'ubushishozi","Ubufasha bw'ibanze bwa imeyili na chat","Uburyo bwinshi bwo kwishyura","Ikimenyetso cyawe","Gucunga ibicuruzwa","Sisitemu y'ibitekerezo by'abakiriya"}	200	1000	t	t	t	t	2025-08-28 20:55:31.882663
ffa5c249-2039-4c47-8a02-94c1768484ac	Enterprise	Ikigo	Complete solution for large businesses with unlimited features	Igisubizo cyuzuye kubucuruzi bunini bufite ibikoresho bitagira imipaka	25000.00	300000.00	{"Unlimited products","Advanced AI analytics","24/7 priority support","All payment methods","Full custom branding","Advanced inventory management","Multi-location support","API access","Custom integrations"}	{"Ibicuruzwa bitagira imipaka","Isesengura ryihuse rya AI","Ubufasha bwa 24/7","Uburyo bwose bwo kwishyura","Ikimenyetso cyuzuye cyawe","Gucunga ibicuruzwa byihuse","Gushyigikira ahantu henshi","Kubona API","Kwishyira hamwe byihariye"}	0	0	t	t	t	t	2025-08-28 20:55:31.882663
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, user_id, plan_id, agent_id, status, billing_cycle, start_date, end_date, amount, payment_method, payment_reference, auto_renew, created_at) FROM stdin;
9e414600-9011-4cfb-944a-2d3ee42a29d5	9c2c8704-8380-48af-bbfc-90e274e5d0c0	51eaab41-6922-42a5-895d-fae65ce2bb16	bc8de22d-caed-47c8-b081-b6176d8fd1d6	active	monthly	2025-08-29 17:45:20.609	2025-09-29 17:45:20.609	5000.00	mtn_mobile_money	\N	f	2025-08-29 16:50:39.847429
735ad443-81c5-4579-8c63-d2ad26fa6c7e	cb82ceb5-5d3b-4104-af66-e6a390574319	51eaab41-6922-42a5-895d-fae65ce2bb16	bc8de22d-caed-47c8-b081-b6176d8fd1d6	active	monthly	2025-08-29 17:52:56.622	2025-09-29 17:52:56.622	5000.00	\N	\N	f	2025-08-29 19:52:56.622842
12910c9c-bc26-444b-8826-533157a4c0ed	45f12178-a476-435e-8edd-c2f578d2ddd3	71cbb5eb-8643-44be-96e1-fdfb7a390767	bc8de22d-caed-47c8-b081-b6176d8fd1d6	active	monthly	2025-08-29 16:57:22.068	2025-08-29 16:57:22.068	10000.00	mobile_money	\N	f	2025-08-29 18:57:22.07413
571cb531-083c-40be-a526-d235f2b705a1	96dc6819-d310-4720-8af9-38f3c092c138	71cbb5eb-8643-44be-96e1-fdfb7a390767	\N	active	monthly	2026-04-04 11:20:51.166	2026-05-04 11:20:51.167	35000.00	mobile_money	\N	f	2026-04-04 13:20:51.168212
2df868bc-169f-4141-8297-fdbc286fb12c	8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	71cbb5eb-8643-44be-96e1-fdfb7a390767	\N	active	monthly	2026-04-04 11:20:51.166	2026-05-04 11:20:51.173	35000.00	mobile_money	\N	f	2026-04-04 13:20:51.173474
\.


--
-- Data for Name: try_on_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.try_on_sessions (id, user_id, customer_image_url, product_id, try_on_image_url, fit_recommendation, status, created_at, is_favorite, notes, rating, customer_image_local_path, try_on_image_local_path, liked_by, saved_by, is_hidden, likes, views) FROM stdin;
6f07f7b9-c865-47c6-93da-e06ceb059865	1134de61-bc26-4e7f-9ea7-4bdd0739e376	data:image/png;base64,abc	4a6216c5-1d2f-4fc7-af36-e8d0682245d2	\N	\N	processing	2026-04-04 13:22:23.315312	f	test note	4	\N	\N	{}	{}	t	0	0
fdc0e057-226b-4cb3-9cec-a36851633680	f2f04302-bef1-411a-9d3b-b03b148287f7	data:image/png;base64,abc	104bc21f-0883-470e-b7db-850f6a066125	\N	\N	processing	2026-04-04 14:12:27.987316	f	test note	4	\N	\N	{}	{}	t	0	0
\.


--
-- Data for Name: user_wallets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_wallets (id, user_id, balance, status, created_at, updated_at) FROM stdin;
9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	28000.00	active	2025-09-05 00:07:38.058898	2025-09-05 16:36:35.614
3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	400.00	active	2025-09-05 23:27:55.0464	2025-09-05 22:33:18.081
f300e20b-828e-4e18-8695-de75dff826a7	3ab5d14e-fe86-456d-8b3d-7c532646001a	0.00	active	2025-09-08 16:36:47.137974	2025-09-08 16:36:47.137974
16a26b4d-c1bd-46ba-8c7f-0341030b0d24	12c2fc98-d1e8-4944-8429-f34a8489a6d2	0.00	active	2026-04-04 00:33:44.471578	2026-04-04 00:33:44.471578
12990eb9-e658-4286-8e5a-410ecd41a809	88737366-4f8a-467f-b2db-3335ec7cecff	0.00	active	2026-04-04 12:28:18.672873	2026-04-04 12:28:18.672873
e31def54-eaf0-4d90-b7a1-2af524fc4792	081ad65e-65c1-4134-8a62-5e44ce6c5dfa	0.00	active	2026-04-04 12:47:51.410098	2026-04-04 12:47:51.410098
90b82e34-333f-4cb9-a95d-8b1afb19dfe6	e6c99a46-4d60-4428-9f95-cace87e4816f	0.00	active	2026-04-04 12:51:45.958295	2026-04-04 12:51:45.958295
f9528b81-2fad-43f6-b81d-cc3f35e00336	e60c6156-b174-4cae-b176-fea5af2c7478	0.00	active	2026-04-04 12:52:12.717111	2026-04-04 12:52:12.717111
dd7a2d39-b0ea-4861-8e52-4fdb6044d9ff	a5188556-a1f2-4f6a-959b-cab3e1e7a0d6	0.00	active	2026-04-04 12:59:15.638431	2026-04-04 12:59:15.638431
c271cb93-74a7-430e-917c-b0a70c717a26	ce659be9-66f5-4554-a456-f968f1e057b3	0.00	active	2026-04-04 13:00:01.20515	2026-04-04 13:00:01.20515
5c8a4d8d-6813-47b1-ab3e-a9164aa7fe9f	d656afd3-1c1d-46a1-a213-493aae8852dd	0.00	active	2026-04-04 13:05:18.871414	2026-04-04 13:05:18.871414
d07f94c0-097c-4fa9-8a66-bf6684e7b38c	77921b88-eaeb-40ac-8184-84052d0501bf	0.00	active	2026-04-04 13:05:42.938908	2026-04-04 13:05:42.938908
6eba0b7a-ce64-4a99-b0d4-3fb1aee76dc0	9acd76b4-1185-4cdd-82dc-9c5a46ecb2da	0.00	active	2026-04-04 13:19:25.926631	2026-04-04 13:19:25.926631
4dd4a30a-4aee-4420-8ada-ab9db13f45b5	6690048b-b20b-4d6f-b8e3-bc7f9f2e6354	0.00	active	2026-04-04 13:20:51.285532	2026-04-04 13:20:51.285532
c342bfe2-cada-495e-83e6-da0772b67c1f	1134de61-bc26-4e7f-9ea7-4bdd0739e376	0.00	active	2026-04-04 13:22:23.34808	2026-04-04 13:22:23.34808
e2e6636e-4bc1-42f4-9774-08d4aa29f1b4	f2f04302-bef1-411a-9d3b-b03b148287f7	0.00	active	2026-04-04 14:12:28.034813	2026-04-04 14:12:28.034813
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, full_name, full_name_rw, phone, location, role, business_name, business_license, is_verified, measurements, profile_image, created_at, terms_accepted, terms_accepted_at, referral_code, referred_by, is_active, style_profile, reset_token, reset_token_expires) FROM stdin;
a5188556-a1f2-4f6a-959b-cab3e1e7a0d6	tester1775300355354@nyambika.test	tester1775300355354@nyambika.test	$2b$10$Fadu5WiKMQTJ8VtS7e4JeOW0Aol9TRlR6dFj58tBnIAao69pRLQKW	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 12:59:15.436017	f	\N	\N	\N	t	{}	\N	\N
3ab5d14e-fe86-456d-8b3d-7c532646001a	customer@demo.com	customer@demo.com	$2b$10$odnlVC7k4Dn1Ar/ylresZOdZXH7cq9PzK5xtWnFvvaFhT7ZguRMcC	Customer	\N	\N	\N	customer	\N	\N	f	\N	\N	2025-08-28 21:38:21.084628	f	\N	\N	\N	t	{}	\N	\N
ce659be9-66f5-4554-a456-f968f1e057b3	tester1775300400956@nyambika.test	tester1775300400956@nyambika.test	$2b$10$0oMYgPuBX3y46lZX5d.4u.BMdUq.BvY3tY3d/d38R9aUET0Efi6Qe	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 13:00:01.040899	f	\N	\N	\N	t	{}	\N	\N
bc8de22d-caed-47c8-b081-b6176d8fd1d6	agent@demo.com	agent@demo.com	$2b$10$CJ/V2tfElU68WhAHa7LVh.OaJu3yeqcjL9sjBOdlpXAnVKMcSyTVm	Agent		0782634364	Kigali Rwanda	agent	\N	\N	t	\N	\N	2025-08-28 21:52:59.16318	f	\N	\N	\N	t	{}	\N	\N
45f12178-a476-435e-8edd-c2f578d2ddd3	amazing@gmail.com	amazing@gmail.com	$2b$10$XHOqOQOKj585pCTYs/R/uu9XCVT3GVi0eyK.RI0NoMVB9Xl5CGVdm	Amazing Market	\N	\N	\N	producer	\N	\N	f	\N	\N	2025-08-29 18:57:00.784637	f	\N	\N	\N	t	{}	\N	\N
019f6d48-dd0e-479c-afb4-82ca4480b5af	ambara@gmail.com	ambara@gmail.com	$2b$10$fxjPtC4g9q0FF2j0A..HseNktLGPzsVbRQdN4etUL8FeXv.rF2Lsm	Ambara House	\N	\N	\N	producer	\N	\N	f	\N	\N	2025-08-29 19:09:35.485674	f	\N	\N	\N	t	{}	\N	\N
cb82ceb5-5d3b-4104-af66-e6a390574319	rexshoes@gmail.com	rexshoes@gmail.com	$2b$10$COtLPl/V4mGpBw6V3tv9PeRBJar1EvGzScX56eBVTMDPsL59hAa3i	Rex Shoes	\N	\N	\N	producer	\N	\N	t	\N	\N	2025-08-29 19:17:31.160613	f	\N	\N	\N	t	{}	\N	\N
9c2c8704-8380-48af-bbfc-90e274e5d0c0	producer@demo.com	producer@demo.com	$2b$10$Srha4ZEJpp9cC54qDwNm8uFB5dYovRn9Ytvd7WfEMXJnRCIZeozym	Producer		0783634364	Kigali Rwanda	producer	\N	\N	t	\N	\N	2025-08-28 21:42:43.664813	f	\N	\N	\N	t	{}	\N	\N
d656afd3-1c1d-46a1-a213-493aae8852dd	tester1775300718580@nyambika.test	tester1775300718580@nyambika.test	$2b$10$Vg5SffUxhHg2s57pCJBeteorrtXYm4o3PTm9qlMeTxCAVgbttmTPK	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 13:05:18.685748	f	\N	\N	\N	t	{}	\N	\N
6fb29f59-66a4-4f21-a3fe-ed32546690ac	fresh3@nyambika.test	fresh3@nyambika.test	$2b$10$rOH9eiYEXWk/f5aD1Amis.GkM9QhpgL4lM/R8Y.lyNHpSdBx57486	Fresh3	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 00:36:30.665535	f	\N	\N	\N	t	{}	\N	\N
77921b88-eaeb-40ac-8184-84052d0501bf	tester1775300742692@nyambika.test	tester1775300742692@nyambika.test	$2b$10$FuMIWGj8VlJITeOlKDAnPO8.VRPL.Filuxio7D.GP3j2wORSugzae	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 13:05:42.778378	f	\N	\N	\N	t	{}	\N	\N
12c2fc98-d1e8-4944-8429-f34a8489a6d2	testpg@nyambika.test	testpg@nyambika.test	$2b$10$Bm6rLwzawF928SOXCLVNBe0VM6atoom8f7YBIRj7tZKRTUcLm3L4e	Updated User	\N	+250700000001	\N	customer	\N	\N	f	\N	\N	2026-04-04 00:33:44.113824	f	\N	\N	\N	t	{"id": "b1eeed19-e68a-4a32-bb24-6324b0249a8b", "user_id": "12c2fc98-d1e8-4944-8429-f34a8489a6d2", "body_type": null, "skin_tone": null, "created_at": "2026-04-04T00:36:31.151195", "updated_at": "2026-04-04T00:36:31.151195", "ai_insights": "{}", "favorite_colors": [], "last_analyzed_at": null, "preferred_brands": [], "style_preferences": "{}", "favorite_categories": []}	\N	\N
c2ee2858-8f64-4c90-bbe5-fef3a39bf7cf	e1775297356069@t.com	e1775297356069@t.com	$2b$10$Q8LASYzY/e0RN4mnERabmu9ryP9wQ3vLUwwcpqi/ZcQHdO0pExFqq	Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 12:09:16.201254	f	\N	\N	\N	t	{}	\N	\N
88737366-4f8a-467f-b2db-3335ec7cecff	tester1775298498312@nyambika.test	tester1775298498312@nyambika.test	$2b$10$euTDMZG42iLVTwIMyNEQ8epXUuU1wN4R6t/BTCA9kKcwvr5QrRp/G	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 12:28:18.411553	f	\N	\N	\N	t	{}	\N	\N
081ad65e-65c1-4134-8a62-5e44ce6c5dfa	tester1775299671137@nyambika.test	tester1775299671137@nyambika.test	$2b$10$bakzYJG8k75JMgmyJ2nDLucILnLdjwAG4zCcz6U1zIlY7qYHlx3ay	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 12:47:51.225002	f	\N	\N	\N	t	{}	\N	\N
e6c99a46-4d60-4428-9f95-cace87e4816f	tester1775299905712@nyambika.test	tester1775299905712@nyambika.test	$2b$10$6b4q0iPZURSxmZd.qKEvcOgxwPi1g/xF9Hp3yF4dH3cRxO/.KhqIW	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 12:51:45.791722	f	\N	\N	\N	t	{}	\N	\N
e60c6156-b174-4cae-b176-fea5af2c7478	tester1775299932438@nyambika.test	tester1775299932438@nyambika.test	$2b$10$j69LGvXpX6as.PFnZSIF1.Dyntq7Nzqk6CXSMMV8.5yPkRFl29uvC	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 12:52:12.527636	f	\N	\N	\N	t	{}	\N	\N
9acd76b4-1185-4cdd-82dc-9c5a46ecb2da	tester1775301565706@nyambika.test	tester1775301565706@nyambika.test	$2b$10$x6wZxKkd.CDoPVHmhU/QsOPNU44Kw.EPpQlHxGQhiNsE2Z0mGqP1m	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 13:19:25.79284	f	\N	\N	\N	t	{}	\N	\N
78783ac3-7064-4d10-a8f1-17dc9b33902d	admin@nyambika.ai	admin@nyambika.ai	$2b$10$bzYpKjqkbsN4uEPwtchBauFhDk2yZxcF.1i8qH3wuZplqYjHEUdam	Nyambika Admin	\N	\N	\N	admin	\N	\N	t	\N	\N	2026-04-04 13:20:51.03054	f	\N	\N	\N	t	{}	\N	\N
96dc6819-d310-4720-8af9-38f3c092c138	producer1@nyambika.ai	producer1@nyambika.ai	$2b$10$GGwRWOkeKQX4zaMvTtz3fubDARWiOR/YLM7gKyH7903mv0YfzlEZm	Producer One	\N	+250780000001	Kigali	producer	\N	\N	t	\N	\N	2026-04-04 13:20:51.097445	f	\N	\N	\N	t	{}	\N	\N
8ffcb77b-c87a-4215-ba5b-8f607b02bcb3	producer2@nyambika.ai	producer2@nyambika.ai	$2b$10$9ab8XGDX2KBnjmL8OYro6.WRG5njXDdJbz27xhoNzFEq/n71DuPIS	Producer Two	\N	+250780000002	Nyamirambo	producer	\N	\N	t	\N	\N	2026-04-04 13:20:51.16403	f	\N	\N	\N	t	{}	\N	\N
6690048b-b20b-4d6f-b8e3-bc7f9f2e6354	customer@nyambika.ai	customer@nyambika.ai	$2b$10$0vuvZhBiBU5wNEReDILsmO.u3mjQGAjsXXNZaIKi0rPeRWXantNKa	Test Customer	\N	\N	\N	customer	\N	\N	t	\N	\N	2026-04-04 13:20:51.283263	f	\N	\N	\N	t	{}	\N	\N
1134de61-bc26-4e7f-9ea7-4bdd0739e376	tester1775301743110@nyambika.test	tester1775301743110@nyambika.test	$2b$10$zzbZFlZ8EV4yuNUUNKSEfuIcaTaXackcvmpVXueSG9a9.vv1M5U8K	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 13:22:23.186264	f	\N	\N	\N	t	{}	\N	\N
f60b9299-b166-4dc1-897a-6688edfa1186	tester1775304275971@nyambika.test	tester1775304275971@nyambika.test	$2b$10$Kh92O2DdWCUb8HYe/qVe2edEl9lXcJqIDciXFdyePF0ThDkODUU82	Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 14:04:36.055526	f	\N	\N	\N	t	{}	\N	\N
f2f04302-bef1-411a-9d3b-b03b148287f7	tester1775304747773@nyambika.test	tester1775304747773@nyambika.test	$2b$10$GtDqCxOYLcMxnqyqgI1XLe5pC9ooJAvwoihVnDRlbS0O.mCdR1AMm	Updated Tester	\N	\N	\N	customer	\N	\N	f	\N	\N	2026-04-04 14:12:27.861992	f	\N	\N	\N	t	{}	\N	\N
1a0f277e-144b-473f-849e-793fe81a4d53	niyongabo	emmanuelniyongabo44@gmail.com	$2b$10$6ba2x.8v0llXwIIuXcFhaOwcJ0JmJddFIMrX5kbSgQkBLxN7RAOCW	Emma	\N	\N	\N	admin	\N	\N	f	\N	\N	2025-08-28 21:13:08.515167	f	\N	\N	\N	t	{}	8d67a3d520170f1d8fb3a02ebd197518f35600688bed7a9c8a6b1b5773178e2c	2026-04-06 18:31:50.936
\.


--
-- Data for Name: wallet_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallet_payments (id, wallet_id, user_id, type, amount, currency, method, provider, phone, status, external_reference, description, created_at) FROM stdin;
e60c6538-af90-4c98-83ca-51d035c3b950	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	500.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757023663822	Demo Mobile Money top-up	2025-09-05 00:07:43.822994
41b8a2e0-2c9e-4f14-8fc1-6bcc8d1fa9f9	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	400.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757023673959	Demo Mobile Money top-up	2025-09-05 00:07:53.960221
073e2e5a-6014-4a67-9163-d160090e2274	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	100.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024890853	Demo Mobile Money top-up	2025-09-05 00:28:10.853581
0affb7cf-8b26-48ce-a35b-e72f269765b0	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	200.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024895012	Demo Mobile Money top-up	2025-09-05 00:28:15.012483
517e35ae-e88f-447c-bc84-d5f72ca967da	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	400.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024898109	Demo Mobile Money top-up	2025-09-05 00:28:18.110165
6e1390c1-f99a-4f8c-aa2f-1c51615a580b	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	100.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024903592	Demo Mobile Money top-up	2025-09-05 00:28:23.592664
fca66936-97c6-4c43-a5f9-1b9f709d92e8	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	400.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024906400	Demo Mobile Money top-up	2025-09-05 00:28:26.401009
5036d589-8cc0-4b21-953d-6f625b961dd7	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	400.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024910436	Demo Mobile Money top-up	2025-09-05 00:28:30.438293
7bbe4aac-50d0-4cad-aa0a-dc95f131b15a	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	600.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024917292	Demo Mobile Money top-up	2025-09-05 00:28:37.2927
3173945c-7076-48ea-b04f-043b92744901	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	1000.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024920509	Demo Mobile Money top-up	2025-09-05 00:28:40.509856
da6745cb-18bb-4bf9-9f86-faa1964e4c40	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	5000.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024923709	Demo Mobile Money top-up	2025-09-05 00:28:43.709754
20e2ca10-2843-4f22-a0d4-a80db829ca2a	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	5000.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024931027	Demo Mobile Money top-up	2025-09-05 00:28:51.027791
dfcfdf4d-8531-4401-ac68-cdbc19caeb74	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	900.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757024937022	Demo Mobile Money top-up	2025-09-05 00:28:57.02354
35c7df08-6494-4c66-9232-37cb7b61075a	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	5000.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757072469547	Demo Mobile Money top-up	2025-09-05 13:41:09.54874
57bb73fe-f659-4ea3-8997-0e94efc192a0	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	5000.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757072472953	Demo Mobile Money top-up	2025-09-05 13:41:12.954852
b2d9bad4-cd8f-4dfc-bd36-b2d9234a0fe0	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757082995111	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 16:36:35.112275
656c62b6-ef81-4588-a4cc-13b285f8e877	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757083001048	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 16:36:41.049147
b8a38bab-3179-40f9-a642-6740243665f8	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757113826675-lryus0	OPAY wallet top-up	2025-09-06 01:10:26.676642
c5ad068d-a91f-4692-9157-75de3cce7ff2	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757164222980-nqot09	OPAY wallet top-up	2025-09-06 15:10:22.981417
0294df3a-58d5-4c65-b799-87817cc1d00f	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757164411323-j5vgnn	OPAY wallet top-up	2025-09-06 15:13:31.324927
9da6bb8b-0885-47c6-9327-d7345a1711b8	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757164808087-kp5d87	OPAY wallet top-up	2025-09-06 15:20:08.087929
0b2126a3-5a42-4a19-9b4a-0ebbbdbfc2c1	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757164997613-sp0g6v	OPAY wallet top-up	2025-09-06 15:23:17.614698
1e15beb5-56b2-441d-b5d1-86ecbca137bf	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757165143125-ssbzz9	OPAY wallet top-up	2025-09-06 15:25:43.126373
a775a8e8-fbad-4571-aa7f-03da9e02cfe4	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	failed	OPAY-1757165844963-hmm2pt	OPAY wallet top-up	2025-09-06 15:37:24.964179
63dfbacd-fa2f-4888-9804-99bb3088e68f	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	failed	OPAY-1757166016509-ijzus5	OPAY wallet top-up	2025-09-06 15:40:16.510726
12323f8b-028c-464e-af55-6916159eb04f	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	failed	OPAY-1757166176188-jkmc3q	OPAY wallet top-up	2025-09-06 15:42:56.189314
20b00a22-8eda-4154-9c38-0e99494687f5	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	failed	OPAY-1757166606223-k48t2z	OPAY wallet top-up	2025-09-06 15:50:06.224259
fa637c5e-027d-4ba6-a1b6-2e6ec35a8b36	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757166857939-45fxaa	OPAY wallet top-up	2025-09-06 15:54:17.940709
b9613f0c-e40e-4bcb-8999-b9bfbe2131fd	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757167037040-748737	OPAY wallet top-up	2025-09-06 15:57:17.041093
46408191-8cda-414a-b715-de6f84c4499b	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757167212416-0lkzc5	OPAY wallet top-up	2025-09-06 16:00:12.417863
9ded396d-817b-4fc1-9cff-63452b2a887f	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757167393313-w1nstd	OPAY wallet top-up	2025-09-06 16:03:13.314162
78338d3f-8672-4047-9b66-f66bebcd4431	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757167635077-wjhuge	OPAY wallet top-up	2025-09-06 16:07:15.078165
66cb8364-58c0-40e0-bad3-a3eabeb7aff6	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757083044625	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 16:37:24.625484
238ee079-59d1-40c4-af50-69bc904c8278	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757083053488	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 16:37:33.488526
e7bf633f-66b7-48bc-af9a-f45a765e4653	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757083100127	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 16:38:20.128182
2c07c231-a8d3-4254-bc83-94b33a3b9d65	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757083188109	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 16:39:48.109743
3e9fa33d-8a7f-46fd-90f0-5c2c07fd5593	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757083206958	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 16:40:07.011805
340517cd-8ae2-4a01-bff4-1775c2501f0d	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757084739663	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 17:05:39.664081
01ebbf53-02df-43ed-8ea7-3baf7db338b1	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757084746388	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 17:05:46.388632
5945a050-d5c8-41ea-af79-6f2d6efb79ef	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757084750661	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 17:05:50.66228
21a4efa7-b16a-4207-b4c8-88b091a43915	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757084760428	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 17:06:00.42922
3d68384f-a7e3-4c2f-baf7-9125d6ef8690	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757084766450	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 17:06:06.451425
6e2fd75d-16f7-41b2-bcb1-780b6925eefc	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757084780095	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 17:06:20.095874
816e58be-d9d4-49ed-aa29-76be1be58809	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757085817880	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 17:23:37.881126
78b6ed77-5bea-461e-9ec0-c829b72ab5b7	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757085833732	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 17:23:53.733234
515d890e-b573-4cb5-9892-8b6f358e1a7c	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757088809747	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 18:13:29.748245
95695417-3fab-47ed-b6e8-91b25092b622	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757089248217	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 18:20:48.218177
b0375da3-d58e-41d0-a60c-8c5f790cf9c3	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757089272419	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 18:21:12.42057
2d8f5aeb-3ae1-42bc-adee-b802a81ca29f	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	topup	5000.00	RWF	mobile_money	mtn	\N	completed	DEMO-1757089407744	Demo Mobile Money top-up	2025-09-05 18:23:27.745113
25e2d9bc-17ea-4a59-b4c9-a6b8506a9078	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757089420772	Product boost fee for product fd6f3b37-8738-4bf4-beef-35c9588c7c21	2025-09-05 18:23:40.772698
a5eccf75-6500-4973-885e-3b099cab3366	9e1b17f5-0175-4a56-ad52-53b15144d7dd	9c2c8704-8380-48af-bbfc-90e274e5d0c0	debit	100.00	RWF	mobile_money	mtn	\N	completed	BOOST-1757090195608	Product boost fee for product 82c59c1f-51c6-4a24-8b23-109f7e6d2eba	2025-09-05 18:36:35.609644
1f3f5383-4fa0-4d2a-8df8-d0f3eccee483	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	completed	OPAY-1757110030685-ycqujc	OPAY wallet top-up	2025-09-06 00:07:10.686519
5fd30e0b-718f-47ec-9fe3-2239611bd3d4	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	completed	OPAY-1757111202255-m9a1wg	OPAY wallet top-up	2025-09-06 00:26:42.257031
ce931203-c87c-407b-b520-f4f6c1d7b890	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	completed	OPAY-1757111328572-xp86po	OPAY wallet top-up	2025-09-06 00:28:48.572936
0de70586-92aa-41ea-8c61-c1848b9c706c	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	completed	OPAY-1757111598070-a2wyq5	OPAY wallet top-up	2025-09-06 00:33:18.071634
8ae0f679-54a7-4129-abba-6d5f01d04f01	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757111632572-xxsc3p	OPAY wallet top-up	2025-09-06 00:33:52.573327
7cb0c7e1-fb78-4a87-b259-d6a60786adfb	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757111793000-su4ozs	OPAY wallet top-up	2025-09-06 00:36:33.00101
cd90cf9c-e86c-40e0-b1b8-c847a343aff1	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757111909625-r7wj0m	OPAY wallet top-up	2025-09-06 00:38:29.626197
ce219c45-bf66-4f09-acef-42006ada995a	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757112009805-8pnug8	OPAY wallet top-up	2025-09-06 00:40:09.806013
ea2e29c4-a53d-4339-b646-18eabdb98a5f	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757112275331-dc7s89	OPAY wallet top-up	2025-09-06 00:44:35.33234
70fb4f7e-cd8b-4158-a365-eacd95306bdc	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757113011032-iqd3jq	OPAY wallet top-up	2025-09-06 00:56:51.033694
5f098ed0-8cdb-4eee-be02-5e34c00de269	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757113419579-5dhji5	OPAY wallet top-up	2025-09-06 01:03:39.579806
99bf8c41-c61b-45a4-8597-088f10d63538	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	failed	OPAY-1757167747747-v2uaxb	OPAY wallet top-up	2025-09-06 16:09:07.748115
c2d780e0-15d8-451e-ba71-45e52f9f1006	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	100.00	RWF	mobile_money	opay	0782634364	pending	OPAY-1757168079397-vpbpnm	OPAY wallet top-up	2025-09-06 16:14:39.397972
bf7a20b0-e992-45b8-a8d2-82c2c26daf50	4dd4a30a-4aee-4420-8ada-ab9db13f45b5	6690048b-b20b-4d6f-b8e3-bc7f9f2e6354	topup	5000.00	RWF	mobile_money	mtn	+250780000003	completed	\N	Initial topup	2026-04-04 11:20:51.286
6fe79dc4-74ca-4358-99d0-35b03cd7352e	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	5000.00	RWF	mobile_money	opay	0782634364	failed	OPAY-1775304031301-3f4zx8	OPAY wallet top-up	2026-04-04 14:00:31.305624
66ec26bd-df44-4a9a-956d-ce8159f0cb48	3476e410-cb7b-40d3-9f80-cee922d498b3	1a0f277e-144b-473f-849e-793fe81a4d53	topup	5000.00	RWF	mobile_money	opay	0782634364	failed	OPAY-1775304050599-x5u87k	OPAY wallet top-up	2026-04-04 14:00:50.599651
\.


--
-- Name: payment_settings_new_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_settings_new_id_seq', 7, true);


--
-- Name: agent_commissions agent_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_producer_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_producer_id_unique UNIQUE (producer_id);


--
-- Name: email_subscriptions email_subscriptions_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_email_key UNIQUE (email);


--
-- Name: email_subscriptions email_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: outfit_collections outfit_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outfit_collections
    ADD CONSTRAINT outfit_collections_pkey PRIMARY KEY (id);


--
-- Name: payment_settings payment_settings_new_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_new_name_key UNIQUE (name);


--
-- Name: payment_settings payment_settings_new_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_new_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: session_comments session_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_comments
    ADD CONSTRAINT session_comments_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: try_on_sessions try_on_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_sessions
    ADD CONSTRAINT try_on_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_wallets user_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_pkey PRIMARY KEY (id);


--
-- Name: user_wallets user_wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: wallet_payments wallet_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_payments
    ADD CONSTRAINT wallet_payments_pkey PRIMARY KEY (id);


--
-- Name: idx_agent_commissions_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_commissions_agent ON public.agent_commissions USING btree (agent_id);


--
-- Name: idx_agent_commissions_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_commissions_level ON public.agent_commissions USING btree (level);


--
-- Name: idx_agent_commissions_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_commissions_payment ON public.agent_commissions USING btree (subscription_payment_id);


--
-- Name: idx_agent_commissions_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_commissions_source ON public.agent_commissions USING btree (source_agent_id);


--
-- Name: idx_agent_commissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_commissions_status ON public.agent_commissions USING btree (status);


--
-- Name: idx_cart_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_user ON public.cart_items USING btree (user_id);


--
-- Name: idx_comments_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_session ON public.session_comments USING btree (session_id);


--
-- Name: idx_comments_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_visible ON public.session_comments USING btree (session_id, is_deleted) WHERE (is_deleted = false);


--
-- Name: idx_customer_image_local_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_image_local_path ON public.try_on_sessions USING btree (customer_image_local_path);


--
-- Name: idx_outfit_collections_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outfit_collections_user_id ON public.outfit_collections USING btree (user_id);


--
-- Name: idx_outfits_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outfits_user ON public.outfit_collections USING btree (user_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_display_order ON public.products USING btree (display_order);


--
-- Name: idx_products_producer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_producer_id ON public.products USING btree (producer_id);


--
-- Name: idx_session_comments_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_comments_session ON public.session_comments USING btree (session_id);


--
-- Name: idx_sessions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_created_at ON public.try_on_sessions USING btree (created_at DESC);


--
-- Name: idx_sessions_likes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_likes ON public.try_on_sessions USING btree (likes DESC);


--
-- Name: idx_sessions_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_product ON public.try_on_sessions USING btree (product_id);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user ON public.try_on_sessions USING btree (user_id);


--
-- Name: idx_sessions_views; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_views ON public.try_on_sessions USING btree (views DESC);


--
-- Name: idx_sessions_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_visibility ON public.try_on_sessions USING btree (is_hidden);


--
-- Name: idx_try_on_sessions_is_favorite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_on_sessions_is_favorite ON public.try_on_sessions USING btree (is_favorite);


--
-- Name: idx_try_on_sessions_is_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_on_sessions_is_hidden ON public.try_on_sessions USING btree (is_hidden);


--
-- Name: idx_try_on_sessions_likes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_on_sessions_likes ON public.try_on_sessions USING btree (likes DESC);


--
-- Name: idx_tryon_image_local_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tryon_image_local_path ON public.try_on_sessions USING btree (try_on_image_local_path);


--
-- Name: idx_user_wallets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_wallets_user_id ON public.user_wallets USING btree (user_id);


--
-- Name: idx_users_referred_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_referred_by ON public.users USING btree (referred_by);


--
-- Name: idx_wallet_payments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_payments_user_id ON public.wallet_payments USING btree (user_id);


--
-- Name: idx_wallet_payments_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_payments_wallet_id ON public.wallet_payments USING btree (wallet_id);


--
-- Name: users_referral_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_referral_code_unique ON public.users USING btree (referral_code);


--
-- Name: payment_settings update_payment_settings_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payment_settings_modtime BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: agent_commissions agent_commissions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id);


--
-- Name: agent_commissions agent_commissions_source_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_source_agent_id_fkey FOREIGN KEY (source_agent_id) REFERENCES public.users(id);


--
-- Name: agent_commissions agent_commissions_subscription_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_subscription_payment_id_fkey FOREIGN KEY (subscription_payment_id) REFERENCES public.subscription_payments(id);


--
-- Name: cart_items cart_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: cart_items cart_items_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: companies companies_producer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_producer_id_users_id_fk FOREIGN KEY (producer_id) REFERENCES public.users(id);


--
-- Name: favorites favorites_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: favorites favorites_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: orders orders_producer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_producer_id_users_id_fk FOREIGN KEY (producer_id) REFERENCES public.users(id);


--
-- Name: outfit_collections outfit_collections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outfit_collections
    ADD CONSTRAINT outfit_collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: products products_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: products products_producer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_producer_id_users_id_fk FOREIGN KEY (producer_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: reviews reviews_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: reviews reviews_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: session_comments session_comments_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_comments
    ADD CONSTRAINT session_comments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.try_on_sessions(id) ON DELETE CASCADE;


--
-- Name: session_comments session_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_comments
    ADD CONSTRAINT session_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_agent_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_agent_id_users_id_fk FOREIGN KEY (agent_id) REFERENCES public.users(id);


--
-- Name: subscription_payments subscription_payments_subscription_id_subscriptions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_subscription_id_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);


--
-- Name: subscriptions subscriptions_agent_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_agent_id_users_id_fk FOREIGN KEY (agent_id) REFERENCES public.users(id);


--
-- Name: subscriptions subscriptions_plan_id_subscription_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_subscription_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: subscriptions subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: try_on_sessions try_on_sessions_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_sessions
    ADD CONSTRAINT try_on_sessions_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: try_on_sessions try_on_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_sessions
    ADD CONSTRAINT try_on_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_wallets user_wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: wallet_payments wallet_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_payments
    ADD CONSTRAINT wallet_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallet_payments wallet_payments_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_payments
    ADD CONSTRAINT wallet_payments_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.user_wallets(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

