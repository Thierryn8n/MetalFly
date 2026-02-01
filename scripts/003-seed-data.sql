-- Metal Fly - Seed Data
-- Dados iniciais para produtos e cursos

-- Produtos de exemplo
INSERT INTO products (name, description, price, category, stock_quantity, is_active) VALUES
  ('Motor Deslizante 200kg', 'Motor para portão deslizante até 200kg. Ideal para residências.', 850.00, 'motores', 50, true),
  ('Motor Deslizante 300kg', 'Motor para portão deslizante até 300kg. Recomendado para portões maiores.', 1200.00, 'motores', 35, true),
  ('Motor Deslizante 500kg', 'Motor para portão deslizante até 500kg. Industrial e comercial.', 1800.00, 'motores', 20, true),
  ('Motor Basculante 1/4 HP', 'Motor para portão basculante residencial.', 650.00, 'motores', 40, true),
  ('Lâmina Meia Cana - Metro', 'Lâmina meia cana para portões. Preço por metro.', 45.00, 'laminas', 500, true),
  ('Lâmina Galvanizada - Metro', 'Lâmina galvanizada premium. Preço por metro.', 55.00, 'laminas', 300, true),
  ('Placa Central Universal', 'Placa central para motores deslizantes.', 120.00, 'placas', 80, true),
  ('Placa Receptora 433MHz', 'Receptor para controle remoto 433MHz.', 85.00, 'placas', 100, true),
  ('Tinta Esmalte Sintético 3.6L', 'Tinta esmalte para acabamento. Várias cores.', 89.00, 'tintas', 150, true),
  ('Primer Anticorrosivo 3.6L', 'Primer para proteção contra ferrugem.', 75.00, 'tintas', 100, true),
  ('Kit Cremalheira 3m', 'Kit cremalheira de nylon para portão deslizante.', 95.00, 'acessorios', 200, true),
  ('Roldana Concava 2"', 'Roldana para portão deslizante.', 25.00, 'acessorios', 500, true),
  ('Fim de Curso Magnético', 'Sensor fim de curso magnético.', 35.00, 'acessorios', 300, true),
  ('Controle Remoto 433MHz', 'Controle remoto para portão automático.', 45.00, 'acessorios', 400, true),
  ('Solda MIG 1kg', 'Arame de solda MIG 0.8mm.', 32.00, 'ferramentas', 150, true),
  ('Disco de Corte 7"', 'Disco de corte para esmerilhadeira.', 8.50, 'ferramentas', 1000, true);

-- Cursos de exemplo
INSERT INTO courses (title, description, is_published, required_subscription, order_index) VALUES
  ('Fundamentos de Serralheria', 'Aprenda os conceitos básicos de serralheria e soldagem para portões.', true, 'free', 1),
  ('Instalação de Portões Deslizantes', 'Curso completo sobre instalação de portões deslizantes automáticos.', true, 'basic', 2),
  ('Instalação de Portões Basculantes', 'Domine a instalação de portões basculantes residenciais.', true, 'basic', 3),
  ('Manutenção Preventiva', 'Aprenda a fazer manutenção preventiva em portões automáticos.', true, 'pro', 4),
  ('Elétrica para Automação', 'Fundamentos de elétrica aplicados à automação de portões.', true, 'pro', 5);

-- Módulos do curso "Fundamentos de Serralheria"
INSERT INTO modules (course_id, title, description, order_index, unlock_condition)
SELECT id, 'Introdução à Serralheria', 'Conhecendo a profissão e ferramentas básicas.', 1, 'always'
FROM courses WHERE title = 'Fundamentos de Serralheria';

INSERT INTO modules (course_id, title, description, order_index, unlock_condition)
SELECT id, 'Tipos de Materiais', 'Conhecendo os diferentes tipos de metais e suas aplicações.', 2, 'finish_previous'
FROM courses WHERE title = 'Fundamentos de Serralheria';

INSERT INTO modules (course_id, title, description, order_index, unlock_condition)
SELECT id, 'Técnicas de Soldagem', 'Soldagem MIG, TIG e Eletrodo revestido.', 3, 'finish_previous'
FROM courses WHERE title = 'Fundamentos de Serralheria';

-- Módulos do curso "Instalação de Portões Deslizantes"
INSERT INTO modules (course_id, title, description, order_index, unlock_condition)
SELECT id, 'Planejamento da Obra', 'Como medir, orçar e planejar uma instalação.', 1, 'always'
FROM courses WHERE title = 'Instalação de Portões Deslizantes';

INSERT INTO modules (course_id, title, description, order_index, unlock_condition)
SELECT id, 'Preparação da Base', 'Nivelamento e preparação do trilho.', 2, 'finish_previous'
FROM courses WHERE title = 'Instalação de Portões Deslizantes';

INSERT INTO modules (course_id, title, description, order_index, unlock_condition)
SELECT id, 'Instalação do Motor', 'Fixação e configuração do motor deslizante.', 3, 'finish_previous'
FROM courses WHERE title = 'Instalação de Portões Deslizantes';

INSERT INTO modules (course_id, title, description, order_index, unlock_condition)
SELECT id, 'Ajustes Finais', 'Fim de curso, força e programação de controles.', 4, 'finish_previous'
FROM courses WHERE title = 'Instalação de Portões Deslizantes';

-- Aulas do módulo "Introdução à Serralheria"
INSERT INTO lessons (module_id, title, content_text, duration_minutes, order_index)
SELECT m.id, 'Bem-vindo ao curso', 'Nesta aula você conhecerá a história da serralheria e o mercado atual.', 10, 1
FROM modules m
JOIN courses c ON c.id = m.course_id
WHERE m.title = 'Introdução à Serralheria' AND c.title = 'Fundamentos de Serralheria';

INSERT INTO lessons (module_id, title, content_text, duration_minutes, order_index)
SELECT m.id, 'Ferramentas Essenciais', 'Conheça as ferramentas indispensáveis para todo serralheiro.', 15, 2
FROM modules m
JOIN courses c ON c.id = m.course_id
WHERE m.title = 'Introdução à Serralheria' AND c.title = 'Fundamentos de Serralheria';

INSERT INTO lessons (module_id, title, content_text, duration_minutes, order_index)
SELECT m.id, 'Segurança no Trabalho', 'EPIs e práticas de segurança fundamentais.', 12, 3
FROM modules m
JOIN courses c ON c.id = m.course_id
WHERE m.title = 'Introdução à Serralheria' AND c.title = 'Fundamentos de Serralheria';
