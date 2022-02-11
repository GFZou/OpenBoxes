CREATE OR REPLACE VIEW stock_movement AS
    select
           r.id,
           r.name,
           r.request_number as identifier,
           r.description,
           r.origin_id,
           r.destination_id,
           r.date_requested,
           r.date_created,
           r.last_updated,
           r.requested_by_id,
           r.created_by_id,
           r.updated_by_id,
           0 as line_item_count,
           s.shipment_type_id,
           s.expected_shipping_date as date_shipped,
           s.expected_delivery_date,
           s.driver_name,
           s.additional_information as comments,
           s.id as shipment_id,
           s.current_status as shipment_status,
           null as tracking_number,
           CASE
               WHEN r.status is null THEN 'REQUESTING'
               WHEN r.status = 'EDITING' THEN 'REQUESTING'
               WHEN r.status = 'VERIFYING' THEN 'REQUESTED'
               WHEN r.status = 'CHECKING' THEN 'PACKED'
               WHEN r.status = 'ISSUED' THEN 'DISPATCHED'
               ELSE r.status
               END as status_code,
           r.id as requisition_id,
           r.status as status,
           r.type as request_type,
           r.source_type as source_type,
           r.requisition_template_id as stocklist_id,
           null as order_id,
           null as order_status,
           'STOCK_MOVEMENT' as stock_movement_type
    from requisition r
        join shipment s on s.requisition_id = r.id
    where r.is_template is false

union all

    select
           o.id,
           o.name,
           o.order_number as identifier,
           o.description,
           o.origin_id,
           o.destination_id,
           o.date_ordered as date_requested,
           o.date_created,
           o.last_updated,
           o.ordered_by_id as requested_by_id,
           o.created_by_id,
           o.updated_by_id,
           0 as line_item_count,
           s.shipment_type_id,
           s.expected_shipping_date as date_shipped,
           s.expected_delivery_date,
           s.driver_name,
           s.additional_information as comments,
           s.id as shipment_id,
           s.current_status as shipment_status,
           0 as tracking_number,
           null as status_code,
           null as requisition_id,
           null as status,
           null as request_type,
           null as source_type,
           null as stocklist_id,
           o.id as order_id,
           o.status as order_status,
           'RETURN_ORDER' as stock_movement_type
    from `order` o
         join order_item oi on oi.order_id = o.id
         join order_shipment os on os.order_item_id = oi.id
         join shipment_item si on si.id = os.shipment_item_id
         join shipment s on s.id = si.shipment_id

    where order_type_id = 'RETURN_ORDER'
    group by o.id, s.id, tracking_number;
