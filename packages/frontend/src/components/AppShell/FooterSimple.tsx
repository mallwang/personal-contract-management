import { Container, Group, Text } from '@mantine/core';
import classes from './FooterSimple.module.css';

export function FooterSimple() {
  const year = new Date().getFullYear();
  return (
    <footer className={classes.footer} role="contentinfo">
      <Container className={classes.inner}>
        <Text c="dimmed" size="sm">
          Personal Contract Management
        </Text>
        <Group className={classes.links}>
          <Text c="dimmed" size="sm">
            © {year}
          </Text>
        </Group>
      </Container>
    </footer>
  );
}
