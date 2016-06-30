BEGIN;

CREATE TABLE hidden.csp_reports (
	id            text      primary key,
	created       timestamp not null
	                        default now(),
	report        jsonb     not null
);

CREATE FUNCTION csp_report(csp_report json) RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
	INSERT INTO hidden.csp_reports (report)
	VALUES (csp_report)
$$;

GRANT EXECUTE ON FUNCTION csp_report(json) TO anonymous;

COMMIT;
