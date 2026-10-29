-- Donnees de demonstration pour les associations de Feytiat.
-- Le schema actuel ne conserve que le nom, le nombre de membres, le statut
-- et les modules; les categories et descriptions ci-dessous ne sont pas stockees.
-- Les associations et les utilisateurs dont l'email existe deja sont ignores.
-- Comptes de demonstration: admin@feytiat.test et antonio.alves@feytiat.test
-- Mot de passe commun: FeytiatDemo2026!

SET NAMES utf8mb4;

START TRANSACTION;

INSERT INTO association (
    nom,
    nombre_membres,
    statut,
    created_at,
    valide_at
)
SELECT
    donnees.nom,
    FLOOR(10 + RAND() * 191),
    'VALIDATED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT 'Amicale des donneurs de sang bénévoles' AS nom, 'Social / Solidarité' AS categorie, 'Don du sang. Contact : Antonio Alves. Téléphone : 06 12 96 51 67.' AS objet
    UNION ALL SELECT 'Association nationale des sous-officiers de réserve de l''Armée de l''air Limousin', 'Social / Solidarité', 'Devoir de mémoire. Contact : André Bellot. Téléphone : 05 55 48 33 71.'
    UNION ALL SELECT 'AS Caporaux chefs parachutistes ACCP', 'Social / Solidarité', 'Devoir de mémoire. Contact : Pascal Hardy. Téléphone : 06 77 72 26 20.'
    UNION ALL SELECT 'Coccinelle Foyer APF', 'Social / Solidarité', 'Animation des résidents APF. Contact : Emilie Granet. Téléphone : 05 55 00 20 13.'
    UNION ALL SELECT 'FNACA (Fédération nationale des anciens combattants d''Algérie)', 'Social / Solidarité', 'Devoir de mémoire. Contact : Michel Villéger. Téléphone : 05 55 00 27 17.'
    UNION ALL SELECT 'Léonarde Fayolle', 'Social / Solidarité', 'Animation des résidents EHPAD. Téléphone : 05 55 48 35 20.'
    UNION ALL SELECT 'Restaurants du Cœur', 'Social / Solidarité', 'Collecte de denrées alimentaires. Contact : Catherine Billoire. Téléphone : 05 55 79 89 89.'
    UNION ALL SELECT 'Secours Populaire', 'Social / Solidarité', 'Actions de solidarité. Contact : Christiane Doirat. Téléphone : 05 55 04 20 00.'
    UNION ALL SELECT 'Ukraine Renaissance', 'Social / Solidarité', 'Soutien aux écoles en Ukraine. Contact : Philippe Henrat. Téléphone : 06 77 38 94 03.'
    UNION ALL SELECT 'Vétérans OPEX-ONU-OTAN France', 'Social / Solidarité', 'Devoir de mémoire. Contact : Jean-René Duchêne. Téléphone : 06 15 42 34 79.'

    UNION ALL SELECT 'Foyer Culturel Laïque (FCL)', 'Foyer Culturel Laïque (FCL)', 'Association regroupant 16 sections culturelles, sportives et de manifestations. Contacts : Claudie Croze (06 77 61 24 43) et André Boden (06 89 92 41 02).'

    UNION ALL SELECT 'Boules club de Feytiat', 'Sport / Animation / Loisirs', 'Pétanque. Contact : Alain Gerbaud. Téléphone : 06 51 95 16 60.'
    UNION ALL SELECT 'CAMAF', 'Sport / Animation / Loisirs', 'Club auto moto. Contact : Alain Bouillon. Téléphone : 06 87 01 13 16.'
    UNION ALL SELECT 'Club sportif de Feytiat', 'Sport / Animation / Loisirs', 'Football. Contact : Gérard Lathière. Téléphone : 06 11 17 25 17.'
    UNION ALL SELECT 'Comité d''organisation de manifestations sportives', 'Sport / Animation / Loisirs', 'Courses cyclistes. Contact : David Pascaud. Téléphone : 06 70 90 35 74.'
    UNION ALL SELECT 'Cyclo Club de Feytiat', 'Sport / Animation / Loisirs', 'VTT et route. Contact : Thomas Duchossois. Téléphone : 06 88 21 34 87.'
    UNION ALL SELECT 'Ducati do Lemouzi', 'Sport / Animation / Loisirs', 'Association de passionnés de Ducati. Contact : Olivier Ribette. Téléphone : 07 87 94 71 83.'
    UNION ALL SELECT 'Ecole de bowling', 'Sport / Animation / Loisirs', 'Activité : bowling. Contact : Jean-Luc Turlotte. Téléphone : 07 77 20 39 08.'
    UNION ALL SELECT 'Feytiat basket', 'Sport / Animation / Loisirs', 'Activité : basket. Contact : Stéphane Serve. Téléphone : 06 22 62 35 34.'
    UNION ALL SELECT 'Feytiat Gym et Danse', 'Sport / Animation / Loisirs', 'Gym et danse. Téléphone : 05 55 48 39 81.'
    UNION ALL SELECT 'FUTSAL – Association sportive de Feytiat', 'Sport / Animation / Loisirs', 'Activité : futsal. Contact : Jérémie Kulitza. Téléphone non communiqué.'
    UNION ALL SELECT 'Judo Club', 'Sport / Animation / Loisirs', 'Activité : judo. Contact : Hélène Galan. Téléphone : 06 07 88 04 45.'
    UNION ALL SELECT 'Red Star Padel Tennis Club', 'Sport / Animation / Loisirs', 'Padel et tennis. Contact : Valérie Geay. Téléphone : 05 55 77 16 69.'
    UNION ALL SELECT 'Shoshin-Karaté-Do Shotokan Kase-Ha', 'Sport / Animation / Loisirs', 'Activité : karaté. Contact : M. Benzenine. Téléphone non communiqué.'
    UNION ALL SELECT 'Tennis Club', 'Sport / Animation / Loisirs', 'Activité : tennis. Contact : Bastien Roumegoux. Téléphone non communiqué.'
    UNION ALL SELECT 'Association philatélique limousine', 'Sport / Animation / Loisirs', 'Collection de timbres. Contact : Christian Fabe. Téléphone : 06 99 51 22 72.'
    UNION ALL SELECT 'ACCA', 'Sport / Animation / Loisirs', 'Pratique de la chasse. Contact : Christian Reynaud. Téléphone : 06 87 79 97 38.'
    UNION ALL SELECT 'Association des parents d''élèves (AFPE)', 'Sport / Animation / Loisirs', 'Association de parents d''élèves. Contact : Damien Tricard. Téléphone : 07 65 23 42 78.'
    UNION ALL SELECT 'CAJAF', 'Sport / Animation / Loisirs', 'Jouets anciens et de collection. Contact : Philippe Audonnet. Téléphone : 06 36 97 96 67.'
    UNION ALL SELECT 'Comité des fêtes', 'Sport / Animation / Loisirs', 'Organisation de fêtes. Contact : Alain Filloux. Téléphone : 06 73 12 17 16.'
    UNION ALL SELECT 'Club du Mas Cerise', 'Sport / Animation / Loisirs', 'Club du 3e âge. Contact : Christiane Bourgeois. Téléphone : 06 21 82 90 40.'
    UNION ALL SELECT 'Comice agricole cantonal des Biards', 'Sport / Animation / Loisirs', 'Activité agricole. Contact : Gilles Mousset. Téléphone : 06 58 43 97 78.'
    UNION ALL SELECT 'Club de la figurine historique du Limousin et des amis du Maréchal Jourdan', 'Sport / Animation / Loisirs', 'Figurines historiques et amis du Maréchal Jourdan. Contact : Lydie Queyroi. Téléphone : 06 28 80 70 77.'
    UNION ALL SELECT 'Les Copains de Feytiat', 'Sport / Animation / Loisirs', 'Repas dansant. Contact : Daniel Batier. Téléphone : 06 31 95 52 82.'
    UNION ALL SELECT 'OCEE', 'Sport / Animation / Loisirs', 'Coopérative école élémentaire. Contact : Thibault Bergeron. Téléphone : 05 55 48 43 23.'
    UNION ALL SELECT 'Vivre au Mas Gauthier', 'Sport / Animation / Loisirs', 'Animation du quartier. Contact : Michèle Daubet. Téléphone : 06 81 14 47 29.'

    UNION ALL SELECT 'Bout d''Ficelle', 'Culture & Arts', 'Atelier chant. Contact : Corinne Château. Téléphone : 06 75 91 31 63.'
    UNION ALL SELECT 'Ciel de Musette', 'Culture & Arts', 'Accordéon. Contact : Alain Faurel. Téléphone : 06 03 28 61 13.'
    UNION ALL SELECT 'Comité de jumelage', 'Culture & Arts', 'Jumelage. Contact : Bernard Mariaux. Téléphone : 06 83 33 28 24.'
    UNION ALL SELECT 'Conservatoire aéronautique du Limousin', 'Culture & Arts', 'Conservatoire aéronautique. Contact : Pascal Dugeay. Téléphone : 06 80 74 18 79.'
    UNION ALL SELECT 'Félibrige', 'Culture & Arts', 'Défense de la langue occitane. Contact : Nicole Bayle. Téléphone : 06 22 04 32 53.'
    UNION ALL SELECT 'La luette agile', 'Culture & Arts', 'Chant et improvisation. Contact : Marc Guiuerot. Téléphone : 06 62 72 63 60.'
    UNION ALL SELECT 'Les Pastoureaux de la Valoine', 'Culture & Arts', 'Groupe folklorique. Contact : Gilles Deneken. Téléphone : 06 81 84 48 85.'
    UNION ALL SELECT 'Les Baladines', 'Culture & Arts', 'Théâtre et ateliers 0-3 ans. Contact : Marcelle Audrerie. Téléphone : 05 55 30 84 22.'
    UNION ALL SELECT 'Mélosongs', 'Culture & Arts', 'Groupe de musique. Contact : Bruno Leycuras. Téléphone : 06 78 85 02 46.'
    UNION ALL SELECT 'Swing Music', 'Culture & Arts', 'Spectacle vivant. Contact : Nicole Lavauzelle Capelle. Téléphone : 06 82 08 42 21.'

    UNION ALL SELECT 'AMAP', 'Divers', 'Maintien d''une agriculture paysanne. Contact : Corinne Mineur. Téléphone : 07 61 14 79 38.'
    UNION ALL SELECT 'Parc d''activités des Portes de Feytiat', 'Divers', 'Parc d''activités. Contact : Nicolas Guillot. Téléphone : 05 55 45 16 42.'
    UNION ALL SELECT 'Prévalescence', 'Divers', 'Interventions thérapeutiques non médicamenteuses. Contact : Sandra Pailler. Téléphone : 06 78 08 35 40.'
    UNION ALL SELECT 'Toutou’s Club 87', 'Divers', 'Éducation canine et agility. Contact : Sylvie Mousnier. Téléphone : 06 48 82 63 80.'
    UNION ALL SELECT 'Mobilité, sécurité, tranquillité à l’Est de Limoges', 'Divers', 'Mobilité, sécurité et tranquillité à l''Est de Limoges. Contact : Valérie Le Gallou. Téléphone non communiqué.'
) AS donnees
WHERE NOT EXISTS (
    SELECT 1
    FROM association AS existante
    WHERE existante.nom = donnees.nom
);

INSERT INTO `user` (
    email,
    roles,
    password,
    nom,
    prenom,
    telephone,
    type_compte,
    is_verified,
    created_at,
    cgu_validate_at,
    association_id
)
SELECT
    'admin@feytiat.test',
    JSON_ARRAY('ROLE_ADMIN'),
    '$2y$13$0ZCQC//C48lbPQoe4z5bQ.WJmw/TYvDkm8GL./2kKLk7k52i7tSmK',
    'Administrateur',
    'Demo',
    NULL,
    'mairie',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM `user` WHERE email = 'admin@feytiat.test'
);

INSERT INTO `user` (
    email,
    roles,
    password,
    nom,
    prenom,
    telephone,
    type_compte,
    is_verified,
    created_at,
    cgu_validate_at,
    association_id
)
SELECT
    'antonio.alves@feytiat.test',
    JSON_ARRAY('ROLE_ASSOCIATION'),
    '$2y$13$0ZCQC//C48lbPQoe4z5bQ.WJmw/TYvDkm8GL./2kKLk7k52i7tSmK',
    'Alves',
    'Antonio',
    '0612965167',
    'association',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    association.id
FROM association
WHERE association.nom = 'Amicale des donneurs de sang bénévoles'
  AND NOT EXISTS (
      SELECT 1 FROM `user` WHERE email = 'antonio.alves@feytiat.test'
  )
LIMIT 1;

COMMIT;
